import { Handler } from '../src/handler';
import { IConstraintsError, ValidationErrorType } from '../src/result';

import * as chai from 'chai';
import * as mocha from 'mocha';
const expect = chai.expect;

import { join } from 'path';

let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, {partialsDir: dir});


describe('StringValidator', () => {
  it('should invalidate a string which has a shorter length than minLength', (done) => {
    let pet = {
      id: 123,
      name: 'Do',
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError> result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('name');
      expect(error.constraintName).to.equals('minLength');
      expect(error.constraintValue).to.equals(3);

      done();
    }).catch(err => done(new Error(err)));
  });


  it('should invalidate a string which has a longer length than maxLength', (done) => {
    let pet = {
      id: 123,
      name: 'They said I cannot put this sentence in here, but look I just did it :O',
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError> result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('name');
      expect(error.constraintName).to.equals('maxLength');
      expect(error.constraintValue).to.equals(15);

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a string matching a regex', (done) => {
    let pet = {
      id: 123,
      name: 'Doggo The Great',
      email: 'doggo@great.com'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(0);

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate a string not matching a regex', (done) => {
    let pet = {
      id: 123,
      name: 'Doggo The Great',
      email: 'no-mail'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError> result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('email');
      expect(error.constraintName).to.equals('pattern');

      done();
    }).catch(err => done(new Error(err)));
  });
});
