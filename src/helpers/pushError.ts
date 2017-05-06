import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { IValidationError, ITypeValidationError, ValidationErrorType } from '../result';
import { IValidatorConfig } from '../configuration-interfaces/validator-config.d';

export function pushError(error: ITypeValidationError, errors: IValidationError[], value: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig) {
  if (config.ignoreError) {
    if (config.ignoreError(error, value, schema, spec)) {
      return;
    }
  }
  errors.push(error);
}
