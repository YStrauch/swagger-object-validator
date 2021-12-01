import * as Promise from 'bluebird';
import { ISpec, ISchema } from '../specs';
import { IValidatorConfig } from '../validator-config';
import { IConstraintsError, ITraceStep } from '../result';
export declare function validateString(test: string, schema: ISchema, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IConstraintsError>>;
