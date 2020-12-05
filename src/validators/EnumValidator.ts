import * as Promise from 'bluebird';
import { ISpec, ISchema} from '../specs'
import { IValidatorConfig } from '../validator-config';
import { pushError } from '../helpers/pushError';
import { IEnumValidationError, ITraceStep, IValidationError, ValidationErrorType } from '../result';


export function validateEnum(test: any, schema: ISchema, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  let errors: Array<IEnumValidationError> = [];

  if (schema.enum.indexOf(test) === -1) {
    pushError(<IEnumValidationError>{
      errorType: ValidationErrorType.ENUM_MISMATCH,
      trace: trace,
      enumIs: test,
      enumShouldBe: schema.enum
    }, errors, test, schema, spec, config);
  }

  return Promise.resolve(errors);
};
