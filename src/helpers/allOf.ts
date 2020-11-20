import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { loadSchema } from '../helpers/loader';

export interface IResolvedSchema extends Swagger.Schema {
  allOfResolved?: boolean;
  allOf?: IResolvedSchema[];
}


export function extendAllAllOfs(schema: IResolvedSchema, config: IValidatorConfig, spec: Swagger.Spec): Promise<IResolvedSchema> {
  if (!schema.allOf || !schema.allOf.length || schema.allOfResolved) {
    return Promise.resolve(schema);
  }

  let parentPromises: Array<Promise<IResolvedSchema>> = [];

  schema.allOf
    .filter(el => !el.allOfResolved)
    .forEach((parentObject: IResolvedSchema) => {
      let parentPromise: Promise<IResolvedSchema>;
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

function extend(from: IResolvedSchema, to: IResolvedSchema): IResolvedSchema {
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

      if (!to.properties) {
        to.properties = {};
      }

      // do not overwrite properties or else polymorphism with enums won't work
      // it should not be necessary to overwrite properties from parent to child
      if (!to.properties[propertyName]) {
        to.properties[propertyName] = property;
      }
    }
  }
  to.allOfResolved = true;
  return to;
}
