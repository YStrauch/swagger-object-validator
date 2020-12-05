import * as Promise from 'bluebird';
import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { ITraceStep, IValidationError } from '../result';
export interface ISchemaWithNullable extends Swagger.Schema {
    'x-nullable'?: boolean;
}
export declare function validateType(test: any, schema: ISchemaWithNullable, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>>;
