import { ISpec, ISchema } from '../specs';
import { IValidatorConfig } from '../validator-config';
import { ITypeValidationError, IValidationError } from '../result';
export declare function pushError(error: ITypeValidationError, errors: IValidationError[], value: any, schema: ISchema, spec: ISpec, config: IValidatorConfig): void;
