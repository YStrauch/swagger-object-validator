import * as Promise from 'bluebird';
import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from './configuration-interfaces/validator-config';
import { loader, loadSchema, loadSchemaByName, resolveHashedPath } from './helpers/loader';
import {
  ITraceStep, ValidationResult
} from './result';
import { validateModel } from './validators/ModelValidator';


export * from './result';
export {
  IValidatorConfig,
};


export class Handler {
  private config: IValidatorConfig;

  public swaggerSpec: Promise<Swagger.Spec>;

  constructor(swaggerSpec?: Swagger.Spec | string, config?: IValidatorConfig) {
    config = config || {};
    // Apply defaults
    if (config.partialsDir === undefined) {
      config.partialsDir = './';
    }

    if (config.disableUniqueItemsOver === undefined) {
      config.disableUniqueItemsOver = 100;
    }

    this.config = config;
    this.swaggerSpec = loader(swaggerSpec, config);

  }


  public validateModel(test: any, schema: string | Swagger.Schema, cb?: (err: string, result?: ValidationResult) => void, trace?: Array<ITraceStep>): Promise<ValidationResult> {
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

  private startValidation(test: any, schema: string | Swagger.Schema, trace?: Array<ITraceStep>): Promise<ValidationResult> {
    let schemaPromise: Promise<Swagger.Schema>;

    return this.swaggerSpec.then(spec => {
      if (!trace) {
        trace = [];
      }
      if (typeof (schema) === 'string') {
        if (!spec) {
          throw new Error('Received a model name or path but no Swagger Spec!');
        }
        trace.push({
          stepName: schema
        });

        if (schema.startsWith('#/')) {
          schemaPromise = loadSchema(resolveHashedPath(schema, spec), spec, this.config);
        } else {
          schemaPromise = loadSchemaByName(schema, spec, this.config);
        }

      } else {
        trace.push({
          stepName: 'root'
        });

        schemaPromise = Promise.resolve(schema);
      }

      return schemaPromise
        .then(schema => validateModel(test, schema, spec, this.config, trace))
        .then(errors => new ValidationResult(errors));
    });
  }
};
