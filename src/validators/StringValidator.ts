import * as Promise from 'bluebird';
import { ISpec, ISchema} from '../specs'
import { IValidatorConfig } from '../validator-config';
import { pushError } from '../helpers/pushError';
import { IConstraintsError, ITraceStep, ValidationErrorType } from '../result';


export function validateString(test: string, schema: ISchema, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IConstraintsError>> {
  let errors: Array<IConstraintsError> = [];

  if (schema.minLength && test.length < schema.minLength) {
    pushError(<IConstraintsError>{
      errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
      trace: trace,
      constraintName: 'minLength',
      constraintValue: schema.minLength
    }, errors, test, schema, spec, config);
  }

  if (schema.maxLength && test.length > schema.maxLength) {
    pushError(<IConstraintsError>{
      errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
      trace: trace,
      constraintName: 'maxLength',
      constraintValue: schema.maxLength
    }, errors, test, schema, spec, config);
  }

  if (schema.pattern) {
    let pattern = schema.pattern;

    if (pattern.charAt(0) === '/' && pattern.charAt(pattern.length - 1) === '/') {
      // remove leading and last '/' because it is not needed
      pattern = pattern.substr(1, pattern.length - 2);
    }
    if (!(new RegExp(pattern).test(test))) {
      pushError(<IConstraintsError>{
        errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
        trace: trace,
        constraintName: 'pattern',
        constraintValue: schema.pattern
      }, errors, test, schema, spec, config);
    }
  }

  return Promise.resolve(errors);
}
