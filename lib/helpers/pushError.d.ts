import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { ITypeValidationError, IValidationError } from '../result';
export declare function pushError(error: ITypeValidationError, errors: IValidationError[], value: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig): void;
