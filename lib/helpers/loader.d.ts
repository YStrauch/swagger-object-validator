import * as Promise from 'bluebird';
import { ISpec, ISchema } from '../specs';
import { IValidatorConfig } from '../validator-config';
export interface ILoadCB {
    (error: any, spec?: ISpec): void;
}
declare type Primitive = boolean | number | string | null | undefined;
interface IObject {
    [key: string]: IObject | Primitive;
}
export declare function loader(input: ISpec | string, config: IValidatorConfig): Promise<ISpec>;
export declare function loadSchemaByName(schemaName: string, spec: ISpec, config: IValidatorConfig): Promise<ISchema>;
export declare function resolveInternalPath(path: string, obj: IObject | ISchema): IObject;
export declare function loadSchema(schema: ISchema, spec: ISpec, config: IValidatorConfig): Promise<ISchema>;
export {};
