import * as Promise from 'bluebird';
import { ISpec, ISchema} from '../specs'
import { IValidatorConfig } from '../validator-config';
import { extendAllAllOfs } from '../helpers/allOf';
import { loadSchema } from '../helpers/loader';
import { pushError } from '../helpers/pushError';
import {
  getTraceString, ITraceStep,

  ITypeValidationError, IValidationError,

  ValidationErrorType
} from '../result';
import { validateModel } from './ModelValidator';


interface ISwaggerProperties {
  [propertyName: string]: ISchema;
}

interface INamedSchema {
  name: string;
  schema: ISchema;
}

export interface ISchemaWithNullable extends ISchema {
  'x-nullable'?: boolean;
}

export function validateObject(test: any, schema: ISchemaWithNullable, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  if (schema === undefined || spec === undefined) {
    throw new Error('Schema or spec is not defined');
  }

  if (config.allowXNullable === true && test === null && schema['x-nullable'] === true) {
    return Promise.resolve([]);
  }

  if (!test || !(test instanceof Object)) {
    let typeIs: string = typeof (test);
    if (Array.isArray(test)) {
      typeIs = 'array';
    }
    if (test === null) {
      typeIs = 'null';
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
  const poly = schema.discriminator && schema.properties[schema.discriminator];
  let concreteClass = poly ? findPolymorphicConcreteClass(schema, trace, test, config, spec) : extendAllAllOfs(schema, config, spec);

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
          let currentPropertySchema: ISchema;
          if (schema.properties && schema.properties[propertyName]) {
            currentPropertySchema = schema.properties[propertyName];
          } else if (schema.additionalProperties) {
            let properties: ISwaggerProperties = <ISwaggerProperties>(<any>schema.additionalProperties);
            currentPropertySchema = <ISchema>properties[propertyName];
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

// checks if possibleChild is derived from parent
function isDerived(possibleChild: ISchema, parent: ISchema, config: IValidatorConfig, spec: ISpec): Promise<boolean> {
  // again, this is hacky (we need the old allOf reference)
  let allOf: [ISchema] = (<any>possibleChild)._allOf;
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

// finds all derived objects to an abstract parent class, either directly or through multiple derivations
function findDerivedObjects(abstractClass: ISchema, config: IValidatorConfig, spec: ISpec): Promise<INamedSchema[]> {
  const discriminatingFeature = abstractClass.discriminator;

  return Promise.resolve(Object.getOwnPropertyNames(spec.definitions))
    .map((name: string) => {
      return <INamedSchema>{
        name: name,
        schema: spec.definitions[name]
      };
    })
    .map((namedSchema: INamedSchema) => {
      return extendAllAllOfs(namedSchema.schema, config, spec)
        .then(schema => {
          return <INamedSchema>{
            name: namedSchema.name,
            schema: schema
          };
        })
    })
    .filter((namedSchema: INamedSchema) => {
      const schema = namedSchema.schema;
      const name = namedSchema.name;
      if (!schema.allOf || !schema.properties[discriminatingFeature]) {
        return false;
      }
      // Two ways of polymorphism, either using enums or the swagger way
      const enumPoly = schema.properties[discriminatingFeature].enum;
      if (enumPoly) {
        return schema.properties[discriminatingFeature].enum.filter(e => abstractClass.properties[discriminatingFeature].enum.indexOf('' + e) !== -1).length > 0;
      }

      // Swagger polymorphism cannot be decided here as we are not looking into the actual data, just into the spec
      return true;
    })
    .filter((namedSchema: INamedSchema) => {
      // Lastly, ensure that we are actually an allOf of the abstract class!
      return Promise.resolve(namedSchema.schema.allOf)
        .map(ref => loadSchema(ref, spec, config))
        .filter((parent: ISchema) => {
          // Better not use parent === abstractClass or you can't validate a model with a dedicated spec with different object references
          return JSON.stringify(parent) === JSON.stringify(abstractClass);
        })
        .then(parents => parents.length > 0)
    })
}

// finds the concrete class to the model test respecting polymorphism
function findPolymorphicConcreteClass(abstractClass: ISchema, trace: Array<ITraceStep>, test: any, config: IValidatorConfig, spec: ISpec): Promise<ISchema> {
  let derivedObjects = findDerivedObjects(abstractClass, config, spec);

  return derivedObjects
    .then(derivedObjects => {
      if (derivedObjects.length === 0) {
        return Promise.reject(`Confusing discriminator - Schema uses discriminator but there are no other Schemas extending it via allOf and using this discriminator property. Trace: ${getTraceString(trace)}`);
      }
      return derivedObjects;
    })
    .filter((derivedObject: INamedSchema) => {
      // Enum-Polymorphism
      if (derivedObject.schema.properties[abstractClass.discriminator].enum
        && derivedObject.schema.properties[abstractClass.discriminator].enum.length === 1
        && derivedObject.schema.properties[abstractClass.discriminator].enum[0] === test[abstractClass.discriminator]
      ) {
        return true;
      }

      // Swagger-Like Polymorphism: the model's discriminator must actually match the name of the parent class
      return test[abstractClass.discriminator] === derivedObject.name;
    })
    .then(derivedObjects => {
      if (derivedObjects.length === 0) {
        return Promise.reject(`Polymorphism Error: No concrete object found. Trace: ${getTraceString(trace)}`);
      }
      if (derivedObjects.length > 1) {
        return Promise.reject(`Polymorphism Error: More than one concrete object found. Trace: ${getTraceString(trace)}`);
      }

      const derivedObject = derivedObjects[0];
      trace[trace.length - 1].concreteModel = derivedObject.name;

      if (derivedObject.schema.discriminator) {
        // Multi-Polymorphism. Because why not.
        trace.push({
          stepName: derivedObject.name
        });

        return findPolymorphicConcreteClass(derivedObject.schema, trace, test, config, spec);
      }

      return derivedObject.schema;
    });
}
