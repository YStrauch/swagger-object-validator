import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { loader, loadSchemaByName } from './helpers/loader';
import { validateModel } from './validators/ModelValidator';
import {
  ValidationResult,
  ITraceStep,
 } from './result';
import { IValidatorConfig } from './configuration-interfaces/validator-config';

export {
  IValidatorConfig,
}
export * from './result';


export class Handler {
  private config: IValidatorConfig;

  public swaggerSpec: Promise<Swagger.Spec>;

  constructor(swaggerSpec: Swagger.Spec | string, config?: IValidatorConfig) {
    config = config || {};
    this.config = config;

    this.swaggerSpec = loader(swaggerSpec, config);
  }


  public validateModel(test: any, schema: string |  Swagger.Schema, cb?: (err: string, result?: ValidationResult) => void, trace?: Array<ITraceStep>): Promise<ValidationResult> {
    let promise = this.startValidation(test, schema, trace);
    if (cb) {
      promise
        .then(result => {
          cb(undefined, result);
        })
        .catch(err => {
          cb(err);
        });
    }

    return promise;

  }

  private startValidation(test: any, schema: string |  Swagger.Schema, trace?: Array<ITraceStep>): Promise<ValidationResult> {
    let schemaPromise: Promise<Swagger.Schema>;

    return this.swaggerSpec.then(spec => {
      if (!trace) {
        trace = [];
      }
      if (typeof (schema) === 'string') {
        trace.push({
          stepName: schema
        });

        schemaPromise = loadSchemaByName(schema, spec, this.config);
      } else {
        schemaPromise = Promise.resolve(schema);
      }

      return schemaPromise
        .then(schema => validateModel(test, schema, spec, this.config, trace))
        .then(errors => new ValidationResult(errors));
    });
  }
};
