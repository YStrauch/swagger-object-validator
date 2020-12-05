import * as Promise from 'bluebird';
import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
export interface ILoadCB {
    (error: any, spec?: Swagger.Spec): void;
}
declare type Primitive = boolean | number | string | null | undefined;
interface IObject {
    [key: string]: IObject | Primitive;
}
export declare function loader(input: Swagger.Spec | string, config: IValidatorConfig): Promise<Swagger.Spec>;
export declare function loadSchemaByName(schemaName: string, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema>;
export declare function resolveInternalPath(path: string, obj: IObject | Swagger.Schema): IObject;
export declare function loadSchema(schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema>;
export {};
