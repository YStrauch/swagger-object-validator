import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { loadSchema } from '../helpers/loader';


export function extendAllAllOfs(schema: Swagger.Schema, config: IValidatorConfig, spec: Swagger.Spec): Promise<Swagger.Schema> {
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
  // we need the reference for polymorphism
  // TODO: this is hacky
  if (!(<any>to)._allOf) {
    (<any>to)._allOf = to.allOf;
    to.allOf = <any>[];
  }
  return to;
}
