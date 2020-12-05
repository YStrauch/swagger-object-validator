import * as chai from 'chai';
import { join } from 'path';
import { Handler, IConstraintsError, ValidationErrorType } from '../src/handler';

const expect = chai.expect;


let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, { partialsDir: dir });

describe('ArrayUniqueItemsValidator', () => {
  it('should invalidate non-unique cities', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      cities_visited: [
        'Berlin',
        'Berlin',
        'Hongkong',
      ]
    };


    validator.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError>result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('cities_visited');
      expect(error.constraintName).to.equals('uniqueItems')
      expect(error.constraintValue).to.equals(true);
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate unique cities', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      cities_visited: [
        'Berlin',
        'Hongkong',
        'Paris'
      ]
    };

    validator.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate many unique pets with a duplicate', (done) => {
    const n_duplicates = 200;

    let validator_allow_size = new Handler(yaml, { partialsDir: dir, disableUniqueItemsOver: n_duplicates + 1 });

    let ancestors = []
    for (let i = 0; i < n_duplicates; i++) {
      ancestors.push({
        id: i,
        name: 'Ancestor' + i,
        cities_visited: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
      });
    }

    // Duplicate the last one, i.e. worst case for performance
    ancestors.push(JSON.parse(JSON.stringify(ancestors[n_duplicates - 1])));

    let pet = {
      id: 123,
      name: 'Biggy',
      ancestors: ancestors
    }

    validator_allow_size.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError>result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('ancestors');
      expect(error.constraintName).to.equals('uniqueItems')
      expect(error.constraintValue).to.equals(true);
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate non-unique pet children', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      children: [
        {
          id: 123,
          name: 'Peter'
        },
        {
          id: 123,
          name: 'Doggo Junior'
        },
        {
          id: 123,
          name: 'Doggo Junior'
        },
        {
          id: 333,
          name: 'Doggo Junior'
        },
      ]
    };

    validator.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError>result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOLATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('children');
      expect(error.constraintName).to.equals('uniqueItems')
      expect(error.constraintValue).to.equals(true);
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate unique pet children', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      children: [
        {
          id: 123,
          name: 'Peter'
        },
        {
          id: 123,
          name: 'Doggo Junior'
        },
        {
          id: 123,
          name: 'Doggo Junior II'
        },
        {
          id: 333,
          name: 'Doggo Junior'
        },
      ]
    };

    validator.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should not check for unique items when deactivated', (done) => {
    let validator_no_check = new Handler(yaml, { partialsDir: dir, disableUniqueItemsOver: 1, suppressUniqueItemsWarning: true });

    let pet = {
      id: 123,
      name: 'Doge',
      children: [
        {
          id: 123,
          name: 'Peter'
        },
        {
          id: 123,
          name: 'Peter'
        }
      ]
    };

    validator_no_check.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });
});
