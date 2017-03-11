import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from '../configuration-interfaces/validator-config.d';
export interface ILoadCB {
    (error: any, spec?: Swagger.Spec): void;
}
export declare function loader(input: Swagger.Spec | string, config: IValidatorConfig): Promise<Swagger.Spec | Swagger.Schema>;
export declare function loadSchemaByName(schemaName: string, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema>;
export declare function loadSchema(schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema>;
