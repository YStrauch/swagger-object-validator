import * as Swagger from 'swagger-schema-official';
import { ICustomValidationError, ITraceStep, IValidationError } from '../result';

export interface IValidatorConfig {
  partialsDir?: string;
  allowAdditionalProperties?: boolean;
  allowXNullable?: boolean;
  disableUniqueItemsOver?: number; // defaults to 100
  suppressUniqueItemsWarning?: boolean;
  disallowHttp?: boolean;
  disallowHttps?: boolean;
  customValidation?: (
    test: any,
    schema: Swagger.Schema,
    spec: Swagger.Spec,
    trace: Array<ITraceStep>,
    otherErrors: Array<ICustomValidationError>,
    resolve?: (validationErrors: ICustomValidationError[]) => void,
    reject?: (reason: string) => void
  ) => ICustomValidationError[] | void | undefined;
  ignoreError?: (
    error: IValidationError,
    value: any,
    schema: Swagger.Schema,
    spec: Swagger.Spec
  ) => boolean;
}
