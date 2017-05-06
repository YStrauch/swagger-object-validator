import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { validateModel } from './ModelValidator';
import { ITraceStep, IValidationError, ITypeValidationError, IConstraintsError, ValidationErrorType } from '../result';
import { pushError } from '../helpers/pushError';

export function validateArray(test: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  let errors: Array<IValidationError> = [];

  if (!Array.isArray(test)) {// fatal error (do not push, just exit)
    return Promise.resolve([
      <ITypeValidationError>{
        errorType: ValidationErrorType.TYPE_MISMATCH,
        trace: trace,
        typeShouldBe: 'array',
        typeIs: typeof test
      }
    ]);
  }

  if (schema.minItems && test.length < schema.minItems) {
    pushError(<IConstraintsError>{
        errorType: ValidationErrorType.CONSTRAINTS_VIOATION,
        trace: trace,
        constraintName: 'minItems',
        constraintValue: schema.minItems
      }, errors, test, schema, spec, config);
  }

  if (schema.maxItems && test.length > schema.maxItems) {
    pushError(<IConstraintsError>{
        errorType: ValidationErrorType.CONSTRAINTS_VIOATION,
        trace: trace,
        constraintName: 'maxItems',
        constraintValue: schema.maxItems
      }, errors, test, schema, spec, config);
  }

  if (schema.uniqueItems) {
    console.warn('WARNING: uniqueItems not supported (you found literally the only swagger feature that is currently unsupported)');
  }

  let promises: Array<Promise<IValidationError[]>> = [];


  test.forEach(
    (entry, index) => {
      let newTrace: Array<ITraceStep> = JSON.parse(JSON.stringify(trace));
      newTrace[newTrace.length - 1].arrayPos = index;

      promises.push(
        validateModel(entry, schema.items, spec, config, newTrace)
      );
    }
  );

  return Promise.all(promises)
    .then(childErrors => childErrors.reduce((a, b) => {
      return a.concat(b);
    }, errors));
};
