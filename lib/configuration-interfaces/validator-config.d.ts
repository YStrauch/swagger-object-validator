import * as Swagger from 'swagger-schema-official';
import { ITraceStep, IValidationError, ICustomValidationError } from '../result';
export interface IValidatorConfig {
    partialsDir?: string;
    allowAdditionalProperties?: boolean;
    disallowHttp?: boolean;
    disallowHttps?: boolean;
    customValidation?: (test: any, schema: Swagger.Schema, spec: Swagger.Spec, trace: Array<ITraceStep>, otherErrors: Array<ICustomValidationError>, resolve?: (validationErrors: ICustomValidationError[]) => void, reject?: (reason: string) => void) => ICustomValidationError[] | void | undefined;
    ignoreError?: (error: IValidationError, value: any, schema: Swagger.Schema, spec: Swagger.Spec) => boolean;
}
