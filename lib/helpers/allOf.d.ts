/// <reference types="bluebird" />
import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
export declare function extendAllAllOfs(schema: Swagger.Schema, config: IValidatorConfig, spec: Swagger.Spec): Promise<Swagger.Schema>;
