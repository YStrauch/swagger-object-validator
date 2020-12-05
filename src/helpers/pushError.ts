import { ISpec, ISchema} from '../specs'
import { IValidatorConfig } from '../validator-config';
import { ITypeValidationError, IValidationError } from '../result';


export function pushError(error: ITypeValidationError, errors: IValidationError[], value: any, schema: ISchema, spec: ISpec, config: IValidatorConfig) {
  if (config.ignoreError) {
    if (config.ignoreError(error, value, schema, spec)) {
      return;
    }
  }
  errors.push(error);
}
