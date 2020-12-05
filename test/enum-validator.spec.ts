import * as chai from 'chai';
import { join } from 'path';
import { Handler } from '../src/handler';
import { IEnumValidationError, ValidationErrorType } from '../src/result';

const expect = chai.expect;


let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, { partialsDir: dir });


describe('EnumValidator', () => {
  it('should validate a string enum', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      status: 'SLEEPING'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a numeric enum', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      numberOfLegs: 4
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate inexistent string enum', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      status: 'much status'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      let error: IEnumValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.ENUM_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('status');
      expect(error.enumIs).to.equals('much status');
      expect(error.enumShouldBe).to.length(3);

      expect(result.errors).to.length(1);

      done();
    }).catch(err => done(new Error(err)));

  });

  it('should invalidate inexistent numeric enum', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      numberOfLegs: 3
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.length(1);

      let error: IEnumValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.ENUM_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('numberOfLegs');
      expect(error.enumIs).to.equals(3);
      expect(error.enumShouldBe).to.length(3);

      done();
    }).catch(err => done(new Error(err)));

  });
});
