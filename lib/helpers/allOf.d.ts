import * as Promise from 'bluebird';
import { ISpec, ISchema } from '../specs';
import { IValidatorConfig } from '../validator-config';
export declare function extendAllAllOfs(schema: ISchema, config: IValidatorConfig, spec: ISpec): Promise<ISchema>;
