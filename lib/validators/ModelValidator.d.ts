import * as Promise from 'bluebird';
import { ISpec, ISchema } from '../specs';
import { IValidatorConfig } from '../validator-config';
import { ITraceStep, IValidationError } from '../result';
export declare function validateModel(test: any, schema: ISchema, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>>;
