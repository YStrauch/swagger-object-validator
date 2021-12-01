import * as Promise from 'bluebird';
import { ISpec, ISchema } from '../specs';
import { IValidatorConfig } from '../validator-config';
import { ITraceStep, IValidationError } from '../result';
export interface ISchemaWithNullable extends ISchema {
    'x-nullable'?: boolean;
}
export declare function validateObject(test: any, schema: ISchemaWithNullable, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>>;
