import * as Promise from 'bluebird';
import { ISpec, ISchema } from '../specs'
import { IValidatorConfig } from '../validator-config';
import { extendAllAllOfs } from '../helpers/allOf';
import { getTypeName } from '../helpers/getTypeName';
import { loadSchema } from '../helpers/loader';
import { ITraceStep, IValidationError } from '../result';
import { validateArray } from './ArrayValidator';
import { validateDate } from './DateValidator';
import { validateEnum } from './EnumValidator';
import { validateType } from './GenericValidator';
import { validateNumber } from './NumberValidator';
import { validateObject } from './ObjectValidator';
import { validateString } from './StringValidator';


export function validateModel(test: any, schema: ISchema, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  if (!trace) {
    trace = [];
  }

  if (schema.allOf && schema.allOf.length) {
    return extendAllAllOfs(schema, config, spec)
      .then(schema => validateResolvedModel(test, schema, spec, config, trace));
  }

  return validateResolvedModel(test, schema, spec, config, trace);
}

function validateResolvedModel(test: any, schema: ISchema, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  if (schema.$ref) {
    return loadSchema(schema, spec, config)
      .then((schema) => validateResolvedModel(test, schema, spec, config, trace));
  }

  let errors: Array<IValidationError> = [];

  // First assure that model is the right type
  let validator = validateType;
  if (schema.enum) {
    validator = validateEnum;
  }

  // add allOf check and loopback to validation again
  if (schema.allOf && schema.allOf.length && !schema.properties) {
    return validateModel(test, schema, spec, config, trace);
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
          case 'null':
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
