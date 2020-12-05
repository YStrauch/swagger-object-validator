import * as chai from 'chai';
import { join } from 'path';
import { Handler } from '../src/handler';
import { ValidationErrorType } from '../src/result';

const expect = chai.expect;


let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, { partialsDir: dir });


describe('ObjectValidator', () => {
  it('should invalidate one missing required property', (done) => {
    let pet = {
      id: 12
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.MISSING_REQUIRED_PROPERTY);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.eq('Pet');
      expect(error.trace[1].stepName).to.eq('name');

      done();
    }).catch(err => done(new Error(err)));


  });


  it('should invalidate two missing required properties', (done) => {
    let pet = {
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(2);

      let missing = ['id', 'name'];

      result.errors.forEach(
        (error, i) => {
          expect(error.errorType).to.equals(ValidationErrorType.MISSING_REQUIRED_PROPERTY);
          expect(error.trace).to.length(2);
          expect(error.trace[0].stepName).to.eq('Pet');
          expect(error.trace[1].stepName).to.eq(missing[i]);
        }
      );

      done();
    }).catch(err => done(new Error(err)));




  });

  it('should invalidate properties that were not specified', (done) => {
    let pet = {
      id: 12,
      name: 'Doge',
      such: 'wow'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);

      let error = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.ADDITIONAL_PROPERTY);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.eq('Pet');
      expect(error.trace[1].stepName).to.eq('such');

      done();
    }).catch(err => done(new Error(err)));

  });
});
