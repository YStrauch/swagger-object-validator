import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { validateModel } from './ModelValidator';
import { ITraceStep, IValidationError, ITypeValidationError, IConstraintsError, ValidationErrorType } from '../result';
import { pushError } from '../helpers/pushError';
import { hasDuplicates } from '../helpers/duplicates';

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
      errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
      trace: trace,
      constraintName: 'minItems',
      constraintValue: schema.minItems
    }, errors, test, schema, spec, config);
  }

  if (schema.maxItems && test.length > schema.maxItems) {
    pushError(<IConstraintsError>{
      errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
      trace: trace,
      constraintName: 'maxItems',
      constraintValue: schema.maxItems
    }, errors, test, schema, spec, config);
  }

  if (schema.uniqueItems) {
    if (test.length > config.disableUniqueItemsOver) {
      if (!config.suppressUniqueItemsWarning) {
        console.warn('The Swagger Spec specifies a uniqueItem constraint on an array of length ' + test.length + ' which is more than the max size of ' + config.disableUniqueItemsOver + '. The constraint will NOT be checked. You can change the cap and disable this message in your validator config. Further warnings of this type will be suppressed.');
        config.suppressUniqueItemsWarning = true;
      }
    } else if (hasDuplicates(test)) {
      pushError(<IConstraintsError>{
        errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
        trace: trace,
        constraintName: 'uniqueItems',
        constraintValue: schema.uniqueItems
      }, errors, test, schema, spec, config);
    }
  }

  let promises: Array<Promise<IValidationError[]>> = [];


  test.forEach(
    (entry, index) => {
      let newTrace: Array<ITraceStep> = JSON.parse(JSON.stringify(trace));
      newTrace[newTrace.length - 1].arrayPos = index;

      let items: Swagger.Schema[] = [];

      if (Array.isArray(schema.items)) {
        items = schema.items;
      } else {
        items = [schema.items];
      }

      items.forEach(item => {
        promises.push(
          validateModel(entry, item, spec, config, newTrace)
        );
      });
    }
  );

  return Promise.all(promises)
    .then(childErrors => childErrors.reduce((a, b) => {
      return a.concat(b);
    }, errors));
};
