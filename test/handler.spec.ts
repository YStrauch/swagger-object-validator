import * as chai from 'chai';
import { join } from 'path';
import { IValidatorConfig } from '../src/validator-config';
import { Handler } from '../src/handler';
import { ICustomValidationError, ValidationErrorType } from '../src/result';

const expect = chai.expect;


let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');

describe('Handler', () => {
  it('should give the possibility to filter errors', (done) => {
    let config: IValidatorConfig = {
      partialsDir: dir,
      ignoreError: (error, value, schema) => {
        return error.errorType === ValidationErrorType.TYPE_MISMATCH
          && error.trace[0].stepName === 'Pet'
          && error.trace[1].stepName === 'id'
          && schema.type === 'integer'
          && value === 'magicKeyThatWillBeAllowed';
      }
    };

    let validator = new Handler(yaml, config);

    let pet = {
      id: 'magicKeyThatWillBeAllowed',
      name: 'Doge'
    };
    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should not crash when allowing null', (done) => {
    let validator = new Handler('https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml', {
      allowAdditionalProperties: true,
      ignoreError: (error, value, schema, spec) => {
        // Set Ignore cases where non-required fields are set to null rather than specified type/format
        return error.errorType === ValidationErrorType.TYPE_MISMATCH && value === null;
      }
    });

    let pet = {
      id: 3942394023,
      name: 'Pippin',
      tag: <any>null
    }

    validator.validateModel(pet, 'Pet', function (err, result) {
      expect(result.errors).to.empty;
      done();
    });
  });

  it('should allow custom validation synchronously', (done) => {
    let config: IValidatorConfig = {
      partialsDir: dir,
      customValidation: (test, schema, spec, trace, otherErrors) => {
        // only validate Pet/name
        if (trace.length < 2
          || trace[trace.length - 2].stepName !== 'Pet'
          || trace[trace.length - 1].stepName !== 'name') {
          return [];
        }

        // disallow Pet/name not starting with an upper case
        let firstChar = test.substr(0, 1);
        if (firstChar !== firstChar.toUpperCase()) {
          return [
            {
              errorType: ValidationErrorType.CUSTOM,
              trace: trace,
              content: 'Name must start with an uppercase letter'
            }
          ];
        }

        // no errors
        return [];
      }
    };

    let validator = new Handler(yaml, config);


    let pet = {
      id: 123,
      name: 'doge'
    };
    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);
      let error: ICustomValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CUSTOM);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('name');
      expect(error.content).to.equals('Name must start with an uppercase letter');

      done();
    }).catch(err => done(new Error(err)));
  });



  it('should allow custom validation asynchronously', (done) => {
    let config: IValidatorConfig = {
      partialsDir: dir,
      customValidation: (test, schema, spec, trace, otherErrors, resolve, reject) => {
        // only validate Pet/name
        if (trace.length < 2
          || trace[trace.length - 2].stepName !== 'Pet'
          || trace[trace.length - 1].stepName !== 'name') {
          resolve([]);
          return;
        }

        // disallow Pet/name not starting with an upper case
        let firstChar = test.substr(0, 1);
        if (firstChar !== firstChar.toUpperCase()) {
          resolve([
            {
              errorType: ValidationErrorType.CUSTOM,
              trace: trace,
              content: 'Name must start with an uppercase letter'
            }
          ]);
          return;
        }

        // no errors
        resolve([]);
        return;
      }
    };

    let validator = new Handler(yaml, config);


    let pet = {
      id: 123,
      name: 'doge'
    };
    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.lengthOf(1);
      let error: ICustomValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CUSTOM);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('name');
      expect(error.content).to.equals('Name must start with an uppercase letter');

      done();
    }).catch(err => done(new Error(err)));
  });
});
