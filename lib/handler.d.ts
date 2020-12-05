import * as Promise from 'bluebird';
import { ISpec, ISchema } from './specs';
import { IValidatorConfig } from './validator-config';
import { ITraceStep, ValidationResult } from './result';
export * from './result';
export { IValidatorConfig };
export declare class Handler {
    private config;
    swaggerSpec: Promise<ISpec>;
    constructor(swaggerSpec?: ISpec | string, config?: IValidatorConfig);
    validateModel(test: any, schema: string | ISchema, cb?: (err: string, result?: ValidationResult) => void, trace?: Array<ITraceStep>): Promise<ValidationResult>;
    private startValidation;
}
