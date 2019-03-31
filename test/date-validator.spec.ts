import { Handler } from '../src/handler';
import { ITypeValidationError, ValidationErrorType } from '../src/result';

import * as chai from 'chai';
import * as mocha from 'mocha';
const expect = chai.expect;

import { join } from 'path';

let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, {partialsDir: dir});


describe('DateValidator', () => {
  it('should validate a date', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      birthdate: '2008-04-01'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    })
    .catch(err => done(new Error(err)));
  });

  it('should invalidate a date where month is greater 12', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      birthdate: '2008-13-01'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.DATE_FORMAT);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('birthdate');

      done();
    })
    .catch(err => done(new Error(err)));
  });


  it('should validate a date-time with fragment', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      birth: '1985-04-12T23:20:50.52Z'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    })
    .catch(err => done(new Error(err)));
  });

  it('should invalidate a date-time where hour is 24', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      birth: '1985-04-12T24:00:00Z'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.DATE_FORMAT);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('birth');

      done();
    })
    .catch(err => done(new Error(err)));
  });

  it('should validate a date-time with time offset', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      birth: '1996-12-19T16:39:57-08:00'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    })
    .catch(err => done(new Error(err)));
  });

  it('should invalidate a corrupt date-time format', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      birth: '1985-04-12T23:20:50.52'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.length(1);
      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.DATE_FORMAT);

      done();
    })
    .catch(err => done(new Error(err)));
  });
});
