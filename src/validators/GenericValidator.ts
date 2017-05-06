import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { getTypeName } from '../helpers/getTypeName';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { ITraceStep, IValidationError, ValidationErrorType } from '../result';
import { pushError } from '../helpers/pushError';

// checks for simple type mismatches (numbers, strings, objects etc)
export function validateType(test: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  let errors: Array<IValidationError> = [];

  let typeIs = getTypeName(test);
  let typeShouldBe: string;

  if (schema.additionalProperties || schema.properties || (schema.type && schema.type === 'object')) {
    typeShouldBe = 'object';
  } else if (schema.type) {
    typeShouldBe = schema.type;
  } else if (!schema.type) {
    return Promise.reject(`Schema is corrupted (no schema/type), schema is ${JSON.stringify(schema)}`);
  } else {
    debugger;
    return Promise.reject(`Schema should be of type "${typeShouldBe}", which is unknown or not yet implemented`);
  }

  // swagger spec has integer and number as type
  // but both should be validated by number validator
  // so replace integer with number
  if (typeShouldBe === 'integer') {
    typeShouldBe = 'number';
  }

  if (typeIs !== typeShouldBe) {
    pushError({
      trace: trace,
      errorType: ValidationErrorType.TYPE_MISMATCH,
      typeIs: typeIs,
      typeShouldBe: typeShouldBe,
    }, errors, test, schema, spec, config);
  }
  return Promise.resolve(errors);
}
