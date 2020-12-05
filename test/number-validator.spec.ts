import * as chai from 'chai';
import { join } from 'path';
import { Handler } from '../src/handler';
import { IConstraintsError, ITypeValidationError, ValidationErrorType } from '../src/result';

const expect = chai.expect;


let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, { partialsDir: dir });


describe('NumberValidator', () => {
  it('should validate a double as a double', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      weight: 12.5
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a negative float as a float', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      money: -1234.58
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate an int instead of a float', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      weight: 12
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });


  it('should invalidate float instead of integer', (done) => {
    let pet = {
      id: 12.3,
      name: 'Doge'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('id');
      expect(error.typeIs).to.equals('number<float>');
      expect(error.typeShouldBe).to.equals('integer<int64>');

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate int64 instead of int32', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      secondsLived: 2147483648 // one more than allowed
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('secondsLived');
      expect(error.typeIs).to.equals('integer<signed_int64>');
      expect(error.typeShouldBe).to.equals('integer<signed_int32>');

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a number as great as the maximum', (done) => {
    let pet = {
      id: 123,
      name: 'Snek',
      weight: 300,
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate a number greater than the maximum', (done) => {
    let pet = {
      id: 123,
      name: 'Snek',
      weight: 301,
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError>result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('weight');
      expect(error.constraintName).to.equals('maximum');
      expect(error.constraintValue).to.equals(300);

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a number slightly higher than the minimum', (done) => {
    let pet = {
      id: 123,
      name: 'Snek',
      weight: 0.1,
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate a number smaller than the minimum', (done) => {
    let pet = {
      id: 123,
      name: 'Snek',
      weight: 0
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError>result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('weight');
      expect(error.constraintName).to.equals('minimum');
      expect(error.constraintValue).to.equals(0);

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a number with multipleOf constraint', (done) => {
    let medium = {
      type: 'Image',
      source: 'myGreatestPr0n.tiff',
      size: 64
    };

    validator.validateModel(medium, 'Medium').then(result => {
      expect(result.errors).to.lengthOf(0);

      done();
    }).catch(err => done(new Error(err)));
  });


  it('should validate a number with multipleOf constraint', (done) => {
    let medium = {
      type: 'Image',
      source: 'myGreatestPr0n.tiff',
      size: 123 // not dividable by 32
    };

    validator.validateModel(medium, 'Medium').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError>result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Medium');
      expect(error.trace[1].stepName).to.equals('size');
      expect(error.constraintName).to.equals('multipleOf');
      expect(error.constraintValue).to.equals(32);

      done();
    }).catch(err => done(new Error(err)));
  });
});
