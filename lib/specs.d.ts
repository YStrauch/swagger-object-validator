import * as Swagger from 'swagger-schema-official';
export interface ISpec extends Swagger.Spec {
}
export interface ISchema extends Swagger.Schema {
    allOfResolved?: boolean;
    allOf?: ISchema[];
    'x-nullable'?: boolean;
}
