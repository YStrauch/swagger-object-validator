/// <reference types="bluebird" />
import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
export interface IResolvedSchema extends Swagger.Schema {
    allOfResolved?: boolean;
    allOf?: IResolvedSchema[];
}
export declare function extendAllAllOfs(schema: IResolvedSchema, config: IValidatorConfig, spec: Swagger.Spec): Promise<IResolvedSchema>;
