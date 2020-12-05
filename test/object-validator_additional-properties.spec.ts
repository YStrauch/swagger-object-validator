import * as chai from 'chai';
import { join } from 'path';
import { Handler } from '../src/handler';
import { ITypeValidationError, ValidationErrorType } from '../src/result';

const expect = chai.expect;


let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, { partialsDir: dir });

describe('ObjectValidator', () => {
  it('should validate additional properties', (done) => {
    let dictionary = {
      foo: 'bar',
      one: 'two'
    };

    validator.validateModel(dictionary, 'Dictionary').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));

  });

  it('should invalidate additional properties with type mismatch', (done) => {
    let dictionary = {
      foo: 'bar',
      one: 1
    };

    validator.validateModel(dictionary, 'Dictionary').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Dictionary');
      expect(error.trace[1].stepName).to.equals('one');
      expect(error.typeIs).to.equals('number');
      expect(error.typeShouldBe).to.equals('string');

      done();
    }).catch(err => done(new Error(err)));


  });

  it('should validate additional properties refering an object', (done) => {
    let dictionaryOfPets = {
      doge: {
        id: 789,
        name: 'Doge'
      }
    };

    validator.validateModel(dictionaryOfPets, 'DictionaryOfPets').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));

  });

  it('should invalidate additional properties refering an object with missing and wrong properties', (done) => {
    let dictionaryOfPets = {
      doge: {
        id: '789',
      }
    };

    validator.validateModel(dictionaryOfPets, 'DictionaryOfPets').then(result => {
      expect(result.errors).to.lengthOf(2);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.MISSING_REQUIRED_PROPERTY);
      expect(error.trace).to.length(3);
      expect(error.trace[0].stepName).to.equals('DictionaryOfPets');
      expect(error.trace[1].stepName).to.equals('doge');
      expect(error.trace[2].stepName).to.equals('name');

      error = result.errors[1];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(3);
      expect(error.trace[0].stepName).to.equals('DictionaryOfPets');
      expect(error.trace[1].stepName).to.equals('doge');
      expect(error.trace[2].stepName).to.equals('id');
      expect(error.typeIs).to.equals('string');
      expect(error.typeShouldBe).to.equals('number');


      done();
    }).catch(err => done(new Error(err)));
  });


  it('should not invalidate additional properties when it is allowed', (done) => {
    let validator = new Handler(yaml, { partialsDir: dir, allowAdditionalProperties: true });

    let pet = {
      id: 123,
      name: 'Doge',
      someAdditionalProperty: 123
    };
    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

});
