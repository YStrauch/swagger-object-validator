import * as Promise from 'bluebird';
import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { pushError } from '../helpers/pushError';
import { IEnumValidationError, ITraceStep, IValidationError, ValidationErrorType } from '../result';


export function validateEnum(test: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
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
