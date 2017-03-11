import * as Swagger from 'swagger-schema-official';
import { IValidationError, ITypeValidationError } from '../result';
import { IValidatorConfig } from '../configuration-interfaces/validator-config.d';
export declare function pushError(error: ITypeValidationError, errors: IValidationError[], value: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig): void;
