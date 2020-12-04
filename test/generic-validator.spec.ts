import { Handler } from '../src/handler';
import { ITypeValidationError, ValidationErrorType } from '../src/result';

import * as chai from 'chai';
const expect = chai.expect;

import { join } from 'path';

let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, { partialsDir: dir });

describe('GenericValidator', () => {
  it('should invalidate string instead of number', (done) => {
    let pet = {
      id: 'Not a number',
      name: 'Doge'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('id');
      expect(error.typeIs).to.equals('string');
      expect(error.typeShouldBe).to.equals('number');

      done();
    }).catch(err => done(new Error(err)));


  });

  it('should invalidate string instead of number', (done) => {
    let spec = {
      type: 'array',
      uniqueItems: true,
      items: {
        type: 'string',
        enum: ['1', '2', '3', '4']
      }
    }

    let model = ['1', '2', '1']; // Should not be valid
    validator.validateModel(model, spec, (err, result) => {
      expect(result.errors).to.lengthOf(1);

      console.log(result.humanReadable());

      done();
    });


  });

  it('should invalidate number instead of string', (done) => {
    let pet = {
      id: 123,
      name: 123
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('name');
      expect(error.typeIs).to.equals('number');
      expect(error.typeShouldBe).to.equals('string');

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a boolean', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      happy: true
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate string instead of boolean', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      happy: 'such happy much wow'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('happy');
      expect(error.typeIs).to.equals('string');
      expect(error.typeShouldBe).to.equals('boolean');

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate null with x-nullable', (done) => {
    let validator = new Handler(yaml, { allowXNullable: true, partialsDir: dir });

    let pet: {
      id: number,
      name: string,
      nullable: string
    } = {
      id: 123,
      name: 'Doge',
      nullable: null
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate null without x-nullable', (done) => {
    let pet: {
      id: number,
      name: string,
      happy: string
    } = {
      id: 123,
      name: 'Doge',
      happy: null
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('happy');
      expect(error.typeIs).to.equals('null');
      expect(error.typeShouldBe).to.equals('boolean');

      done();
    }).catch(err => done(new Error(err)));
  });
});
