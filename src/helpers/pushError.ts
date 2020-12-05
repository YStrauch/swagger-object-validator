import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { ITypeValidationError, IValidationError } from '../result';


export function pushError(error: ITypeValidationError, errors: IValidationError[], value: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig) {
  if (config.ignoreError) {
    if (config.ignoreError(error, value, schema, spec)) {
      return;
    }
  }
  errors.push(error);
}
