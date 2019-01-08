import { Handler } from '../src/handler';
import { ITypeValidationError, ValidationErrorType } from '../src/result';

import * as chai from 'chai';
const expect = chai.expect;

import { join } from 'path';

let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, {partialsDir: dir});

describe('ObjectValidator', () => {
  it('should invalidate a nullable object when null and option is disabled', (done) => {
    let nullableRef: {
      nullableRef: {
        test: string
      }
    } = {
      nullableRef: null
    };

    validator.validateModel(nullableRef, 'NullableRef').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('NullableRef');
      expect(error.trace[1].stepName).to.equals('nullableRef');
      expect(error.typeIs).to.equals('null');
      expect(error.typeShouldBe).to.equals('object');

      done();
    })
    .catch(err => {
      done(new Error(err));
    });
  });

  it('should validate a nullable object when null', (done) => {
    let validator = new Handler(yaml, {allowXNullable: true, partialsDir: dir});

    let nullableRef: {
      nullableRef: {
        test: string
      }
    } = {
      nullableRef: null
    };

    validator.validateModel(nullableRef, 'NullableRef').then(result => {
      expect(result.errors).to.empty;

      done();
    })
    .catch(err => {
      done(new Error(err));
    });
  });
});
