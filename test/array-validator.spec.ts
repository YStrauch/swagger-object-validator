import { Handler } from '../src/handler';
import { ITypeValidationError, IConstraintsError, ValidationErrorType } from '../src/result';

import * as chai from 'chai';
import * as mocha from 'mocha';
const expect = chai.expect;

import { join } from 'path';

let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, {partialsDir: dir});


describe('ArrayValidator', () => {
  it('should validate pets', (done) => {
    let pets = [
      {
        id: 123,
        name: 'Doge',
        tag: 'Much Doge, such Tag'
      }, {
        id: 456,
        name: 'Snek'
      }
    ];

    validator.validateModel(pets, 'Pets',).then(result => {
      expect(result.errors).to.empty;

      done();
    })
    .catch(err => done(new Error(err)));

  });


  it('should invalidate a pet in pets with missing id', (done) => {
    let pets = [
      {
        name: 'Doge',
        tag: 'Much Doge, such Tag'
      }, {
        id: 456,
        name: 'Snek'
      }
    ];

    validator.validateModel(pets, 'Pets',).then(result => {
      expect(result.errors).to.length(1);
      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.MISSING_REQUIRED_PROPERTY);

      done();
    })
    .catch(err => done(new Error(err)));

  });


  it('should invalidate string instead of number within an array', (done) => {
    let pets = [
      {
      id: 'Not a number',
      name: 'Doge'
      }
    ];

    validator.validateModel(pets, 'Pets',).then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: ITypeValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pets');
      expect(error.trace[0].arrayPos).to.equals(0);
      expect(error.trace[1].stepName).to.equals('id');
      expect(error.typeIs).to.equals('string');
      expect(error.typeShouldBe).to.equals('number');

      done();
    })
    .catch(err => done(new Error(err)));

  });


  it('should validate unique pet children', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      children: [
        {
          id: 1234,
          name: 'Doggo Junior'
        },
        {
          id: 12345,
          name: 'Doggo Junior II'
        }
      ]
    };

    validator.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.lengthOf(0);

      done();
    })
    .catch(err => done(new Error(err)));

  });


  it('should invalidate empty pet children', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      children: <[any]>[] // minItems is 1
    };

    validator.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError> result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('children');
      expect(error.constraintName).to.equals('minItems');
      expect(error.constraintValue).to.equals(1);

      done();
    })
    .catch(err => done(new Error(err)));

  });


  it('should invalidate too much pet children', (done) => {
    let children: any[] = [];

    for (let i = 0; i < 11; i++) {
      children.push({
        id: i,
        name: `Doggo${i}`
      });
    }

    let pet = {
      id: 123,
      name: 'Doge',
      children: children
    };

    validator.validateModel(pet, 'Pet',).then(result => {
      expect(result.errors).to.lengthOf(1);

      let error: IConstraintsError = <IConstraintsError> result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOATION);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Pet');
      expect(error.trace[1].stepName).to.equals('children');
      expect(error.constraintName).to.equals('maxItems');
      expect(error.constraintValue).to.equals(10);

      done();
    })
    .catch(err => done(new Error(err)));

  });


  // Unique check not yet implemented
  // it('should invalidate non-unique pet children', (done) => {
  //   let pet = {
  //     id: 123,
  //     name: 'Doge',
  //     children: [
  //       {
  //         id: 123,
  //         name: 'Doggo Junior'
  //       },
  //       {
  //         id: 123,
  //         name: 'Doggo Junior'
  //       }
  //     ]
  //   };

  //   validator.validateModel(pet, 'Pet',).then(result => {
  //     expect(result.errors).to.lengthOf(1);

  //     let error: IConstraintsError = <IConstraintsError> result.errors[0];
  //     expect(error.errorType).to.equals(ValidationErrorType.CONSTRAINTS_VIOATION);
  //     expect(error.trace).to.length(2);
  //     expect(error.trace[0].stepName).to.equals('Pet');
  //     expect(error.trace[1].stepName).to.equals('children');
  //     expect(error.constraintName).to.equals('uniqueItems
  //     expect(error.constraintValue).to.e);ms
  //     done();
  //   })
  //   .catch(err => done(new Error(err)));

  // });


});
