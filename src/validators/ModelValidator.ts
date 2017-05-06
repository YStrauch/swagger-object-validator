import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { getTypeName } from '../helpers/getTypeName';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { validateEnum } from './EnumValidator';
import { validateArray } from './ArrayValidator';
import { validateType } from './GenericValidator';
import { validateNumber } from './NumberValidator';
import { validateObject } from './ObjectValidator';
import { validateDate } from './DateValidator';
import { validateString } from './StringValidator';
import { ITraceStep, ValidationResult, IValidationError } from '../result';
import { loadSchema } from '../helpers/loader';

export function validateModel(test: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  if (!trace) {
    trace = [];
  }

  if (schema.$ref) {
    return loadSchema(schema, spec, config)
      .then((schema) => validateModel(test, schema, spec, config, trace));
  }


  let errors: Array<IValidationError> = [];

  // First assure that model is the right type
  let validator = validateType;
  if (schema.enum) {
    validator = validateEnum;
  }

  return validator(test, schema, spec, config, trace)
    .then(errors => {

      if (errors.length) {
        // If enum mismatches or the type itself mismatches, don't continue validation
        return errors;
      }

      // continue validation
      validator = undefined;

      // now validate sub models
      if (schema.additionalProperties || schema.properties || (schema.type && schema.type === 'object')) {
        validator = validateObject;
      } else {
        switch (getTypeName(test)) {
          case 'string':
            if (schema.format === 'date' || schema.format === 'date-time') {
              validator = validateDate;
            } else {
              validator = validateString;
            }
            break;
          case 'boolean':
            break;
          // case 'integer':
          //   validator = validateNumber;
          //   break;
          case 'number':
            validator = validateNumber;
            break;
          case 'array':
            validator = validateArray;
            break;
          default:
            return Promise.reject(`Type ${schema.type} not yet implemented (in ${schema.title})`);
        }
      }

      // if validator is undefined => no further validation needed
      return (validator ? validator(test, schema, spec, config, trace) : Promise.resolve([]))
        .then(errors => {
          if (config.customValidation) {
            return new Promise<IValidationError[]>((resolve, reject) => {
              let ret = config.customValidation(test, schema, spec, trace, errors, resolve, reject);
              if (Array.isArray(ret)) {
                resolve(ret);
              }
            })
              .then(customErrors => errors.concat(customErrors));
          } else {
            return errors;
          }
        });
    });
}
