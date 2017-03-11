import { IValidatorConfig } from '../configuration-interfaces/validator-config.d';
import { ITraceStep, IValidationError } from '../result';
import * as Swagger from 'swagger-schema-official';
export declare function validateType(test: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>>;
