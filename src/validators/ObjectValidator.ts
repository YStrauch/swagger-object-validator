import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from '../configuration-interfaces/validator-config.d';
import { validateModel } from './ModelValidator';
import { ITraceStep,
  IValidationError,
  ITypeValidationError,
  ValidationErrorType,
  ValidationResult,
  getTraceString
 } from '../result';
import { pushError } from '../helpers/pushError';
import { loadSchema, loadSchemaByName } from '../helpers/loader';


interface ISwaggerProperties {
  [propertyName: string]: Swagger.Schema;
}


export function validateObject(test: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  if (schema === undefined || spec === undefined) {
    throw new Error('Schema or spec is not defined');
  }

  if (!test || !(test instanceof Object)) {
    let typeIs: string = typeof (test);
    if (Array.isArray(test)) {
      typeIs = 'array';
    }

    let typeShouldBe = schema.title ? schema.title : 'object';

    return Promise.resolve([ // fatal error (do not push)
      <ITypeValidationError>{
        trace: trace,
        errorType: ValidationErrorType.TYPE_MISMATCH,
        typeIs: typeIs,
        typeShouldBe: typeShouldBe,
      }
    ]);
  }

  let childValidation: Array<Promise<IValidationError[]>> = [];
  let errors: Array<IValidationError> = [];

  // polymorphism: Find concrete object
  let concreteClass = schema.discriminator ? findConcreteObject(schema, trace, test, config, spec) : extendAllAllOfs(schema, config, spec);

  return concreteClass
    // allOf inheritance: inherit both required and optional fields
      .then(schema => {
        // check for required properties
        if (schema.required) {
          schema.required.forEach(
            (propertyName) => {
              if (test[propertyName] === undefined) {
                let newTrace: Array<ITraceStep> = JSON.parse(JSON.stringify(trace));
                newTrace.push({
                  stepName: propertyName
                });

                pushError({
                  errorType: ValidationErrorType.MISSING_REQUIRED_PROPERTY,
                  trace: newTrace
                }, errors, test, schema, spec, config);
              }
            }
          );
        }

        // check all properties
        for (let propertyName in test) {
          if (test.hasOwnProperty(propertyName)) {
            let currentPropertyTest = test[propertyName];
            let currentPropertySchema: Swagger.Schema;
            if (schema.properties && schema.properties[propertyName]) {
              currentPropertySchema = schema.properties[propertyName];
            } else if (schema.additionalProperties) {
              let properties: ISwaggerProperties = <ISwaggerProperties>(<any>schema.additionalProperties);
              currentPropertySchema = <Swagger.Schema>properties[propertyName];
            }

            let newTrace: Array<ITraceStep> = JSON.parse(JSON.stringify(trace));
            newTrace.push({
              stepName: propertyName
            });


            if (!currentPropertySchema) {
              // additional property
              if (config.allowAdditionalProperties === true) {
                // do nothing
              } else if (!schema.additionalProperties) {
                pushError({
                  errorType: ValidationErrorType.ADDITIONAL_PROPERTY,
                  trace: newTrace
                }, errors, test, schema, spec, config);
              } else {
                // check if additionalProperties match the type
                childValidation.push(validateModel(currentPropertyTest, schema.additionalProperties, spec, config, newTrace));
              }
            } else {
              childValidation.push(validateModel(currentPropertyTest, currentPropertySchema, spec, config, newTrace));
            }


          }
        }

        if (childValidation) {
          return Promise.all(childValidation).then(
            childErrors => childErrors.reduce((a, b) => {
              return a.concat(b);
            }, errors));
        }

        return Promise.resolve(errors);
      });
}

function extendAllAllOfs(schema: Swagger.Schema, config: IValidatorConfig, spec: Swagger.Spec): Promise<Swagger.Schema> {
  if (!schema.allOf || !schema.allOf.length) {
    return Promise.resolve(schema);
  }

  let parentPromises: Array<Promise<Swagger.Schema>> = [];

  schema.allOf.forEach(
    (parentObject: Swagger.Schema) => {
      let parentPromise: Promise<Swagger.Schema>;
      if (parentObject.$ref) {
        parentPromise = loadSchema(parentObject, spec, config);
      } else {
        parentPromise = Promise.resolve(parentObject);
      }

      // extend parent object recursively
      parentPromise
        .then(
        parentObject => extendAllAllOfs(parentObject, config, spec)
        )
        .then(parentObject => {
          // extend all properties from parent object
          return extend(parentObject, schema);
        });
      parentPromises.push(parentPromise);
    }
  );

  return Promise.all(parentPromises)
    .then(parents => {
      let result = parents.reduce((a, b) => {
        return extend(b, a);
      }, schema);
      return result;
    });
}


function extend(from: Swagger.Schema, to: Swagger.Schema): Swagger.Schema {
  // extend all required properties from parent object
  if (from.required) {
    if (to.required) {
      // either merge our required with the parent's
      to.required = <[string]>to.required.concat(
        // filter out duplicates
        from.required.filter(item => {
          return to.required.indexOf(item) === -1;
        })
      );
    } else {
      // or apply it
      to.required = from.required;
    }
  }
  for (let propertyName in from.properties) {
    if (from.properties.hasOwnProperty(propertyName)) {
      let property = from.properties[propertyName];

      // do not overwrite properties or else polymorphism with enums won't work
      // it should not be necessary to overwrite properties from parent to child
      if (!to.properties[propertyName]) {
        to.properties[propertyName] = property;
      }
    }
  }
  // we need the reference for polymorphism
  // TODO: this is hacky
  if (!(<any>to)._allOf) {
    (<any>to)._allOf = to.allOf;
    to.allOf = <[Swagger.Schema]>[];
  }
  return to;
}

// checks if possibleChild is derived from parent
function isDerived(possibleChild: Swagger.Schema, parent: Swagger.Schema, config: IValidatorConfig, spec: Swagger.Spec): Promise<boolean> {
  // again, this is hacky (we need the old allOf reference)
  let allOf: [Swagger.Schema] = (<any>possibleChild)._allOf;
  if (!allOf) {
    return Promise.resolve(false);
  }

  return Promise.all(
    allOf.map(
      // childParent is one of the parents of the child
      // we just need to check if childParent === parent
      (childParent) => {
        return loadSchema(childParent, spec, config)
          .then(childParent => parent === childParent);
      }
    )
  ).then(isOneDerived => isOneDerived.filter(
    derived => derived
  ).length !== 0);
}

// finds all classes that inherit from this one
function findConcreteObject(abstractClass: Swagger.Schema, trace: Array<ITraceStep>, test: any, config: IValidatorConfig, spec: Swagger.Spec): Promise<Swagger.Schema> {
  let derivedObjects: Array<Promise<{ schema: Swagger.Schema, schemaName: string } | undefined>> = [];

  let stopLoop = false;

  for (let possibleDerivedClassName in spec.definitions) {
    if (spec.definitions.hasOwnProperty(possibleDerivedClassName)) {
      if (stopLoop) {
        break;
      }

      derivedObjects.push(
        loadSchemaByName(possibleDerivedClassName, spec, config)
          .then(schema => extendAllAllOfs(schema, config, spec))
          .then(possibleDerivedClass => {
            return isDerived(possibleDerivedClass, abstractClass, config, spec)
              .then(derived => {
                if (derived) {
                  stopLoop = true;

                  return {
                    schema: possibleDerivedClass,
                    schemaName: possibleDerivedClassName
                  };
                }
                return undefined;
              });
          })
      );
    }
  }

  return Promise.all(derivedObjects)
    .then(derivedObjects => derivedObjects.filter(derivedObject => derivedObject !== undefined))
    .then(derivedObjects => {
      if (derivedObjects.length === 0) {
        return Promise.reject(`Confusing discriminator - Schema uses discriminator but there are no other Schemas extending it via allOf. Trace: ${getTraceString(trace)}`);
      }

      return derivedObjects.filter(derivedObject => {
        // we found a derived object. now we have to check whether the discriminator name matches (-> the swagger way)
        let validPolymorhpism = test[abstractClass.discriminator] === derivedObject.schemaName;

        // or, following an enum polymorphism, where enums are used
        // check, if parent object uses enum, and if child object correctly chose on of the parent object enums
        if (!validPolymorhpism && abstractClass.properties[abstractClass.discriminator].enum && abstractClass.properties[abstractClass.discriminator].enum.indexOf(test[abstractClass.discriminator]) !== -1) {
          if (derivedObject.schema.properties[abstractClass.discriminator].enum
            && derivedObject.schema.properties[abstractClass.discriminator].enum.length === 1
            && derivedObject.schema.properties[abstractClass.discriminator].enum[0] === test[abstractClass.discriminator]
          ){
            validPolymorhpism = true;
          }
        }

        if (validPolymorhpism) {
          // manipulate the trace: set the concrete name within brackets, so it will look like Medium<Image>
          trace[trace.length - 1].concreteModel = derivedObject.schemaName;
        }

        return validPolymorhpism;
      });
    })
    .then(derivedObjects => {
      if (derivedObjects.length === 0) {
        return Promise.reject(`Polymorphism Error: No concrete object found. Trace: ${getTraceString(trace)}`);
      }
      if (derivedObjects.length > 1) {
        return Promise.reject(`Polymorphism Error: More than one concrete object found. Trace: ${getTraceString(trace)}`);
      }
      return Promise.resolve(derivedObjects[0].schema);
    });
}
