import * as Swagger from 'swagger-schema-official';
import * as Promise from 'bluebird';

import { IValidatorConfig } from '../configuration-interfaces/validator-config';
import { ITraceStep, IValidationError, ITypeValidationError, IConstraintsError, ValidationErrorType } from '../result';
import { pushError } from '../helpers/pushError';

export function validateNumber(test: any, schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  let errors: Array<IValidationError> = [];

  if (!schema.format) {
    if (schema.type === 'integer') {
      schema.format = 'int64';
    } else if (schema.type === 'number') {
      schema.format = 'double';
    }
  }


  let testIsInteger = test === parseInt(test + '', 10);
  if (testIsInteger) {
    let testIsS32 = test > -2147483649 && test < 2147483648;

    if (!testIsS32 && schema.format === 'int32') {
      pushError(<ITypeValidationError>{
          errorType: ValidationErrorType.TYPE_MISMATCH,
          trace: trace,
          typeShouldBe: 'integer<signed_int32>',
          typeIs: 'integer<signed_int64>'
        }, errors, test, schema, spec, config);
    }

  } else {
    // test is float or double

    let isFloat: boolean;
    if (test === 0) {
      isFloat = true;
    } else if (test > 0) {
      isFloat = test > 1.5E-45 && test < 3.4E38;
    } else {
      isFloat = test < -1.5E-45 && test > -3.4E38;
    }

    let typeIs = `number<${isFloat ? 'float' : 'double'}>`;

    if (schema.type === 'integer') { // should be int, but is float or double
      pushError(<ITypeValidationError>{
          errorType: ValidationErrorType.TYPE_MISMATCH,
          trace: trace,
          typeShouldBe: `integer<${schema.format}>`,
          typeIs: typeIs
        }, errors, test, schema, spec, config);
    }

    if (!isFloat && schema.format === 'float') {
      pushError(<ITypeValidationError>{
          errorType: ValidationErrorType.TYPE_MISMATCH,
          trace: trace,
          typeShouldBe: `number<${schema.format}>`,
          typeIs: typeIs
        }, errors, test, schema, spec, config);
    }
  }






  // START: CONSTRAINS
  if (schema.maximum !== undefined) {
    if (schema.exclusiveMaximum && test >= schema.maximum || !schema.exclusiveMaximum && test > schema.maximum) {
      pushError(<IConstraintsError>{
          errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
          trace: trace,
          constraintName: 'maximum',
          constraintValue: schema.maximum
        }, errors, test, schema, spec, config);
    }
  }

  if (schema.minimum !== undefined) {
    if (schema.exclusiveMinimum && test <= schema.minimum || !schema.exclusiveMinimum && test < schema.minimum) {
      pushError(<IConstraintsError>{
          errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
          trace: trace,
          constraintName: 'minimum',
          constraintValue: schema.minimum
        }, errors, test, schema, spec, config);
    }
  }

  if (schema.multipleOf && test % schema.multipleOf !== 0) {
      pushError(<IConstraintsError>{
          errorType: ValidationErrorType.CONSTRAINTS_VIOLATION,
          trace: trace,
          constraintName: 'multipleOf',
          constraintValue: schema.multipleOf
        }, errors, test, schema, spec, config);
  }


  return Promise.resolve(errors);
}
