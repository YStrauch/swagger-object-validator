/// <reference types="bluebird" />
import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';
import { IValidatorConfig } from '../configuration-interfaces/validator-config.d';
import { ITraceStep, IValidationError } from '../result';
export declare function validateArray(test: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>>;
