import * as Promise from 'bluebird';
import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from './configuration-interfaces/validator-config';
import { ITraceStep, ValidationResult } from './result';
export * from './result';
export { IValidatorConfig, };
export declare class Handler {
    private config;
    swaggerSpec: Promise<Swagger.Spec>;
    constructor(swaggerSpec?: Swagger.Spec | string, config?: IValidatorConfig);
    validateModel(test: any, schema: string | Swagger.Schema, cb?: (err: string, result?: ValidationResult) => void, trace?: Array<ITraceStep>): Promise<ValidationResult>;
    private startValidation;
}
