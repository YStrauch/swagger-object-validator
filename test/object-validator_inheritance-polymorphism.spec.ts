import { Handler } from '../src/handler';
import { IValidationError, ValidationErrorType } from '../src/result';

import * as chai from 'chai';
import * as mocha from 'mocha';
const expect = chai.expect;

import { join } from 'path';

let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, {partialsDir: dir});


describe('ObjectValidator', () => {
  it('should validate inherited properties', (done) => {
    let image = {
      type: 'Image',
      owner: 'John Cena',
      source: 'source'
    };


    validator.validateModel(image, 'Image').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate missing required inherited property', (done) => {
    let image = {
      owner: 'John Cena', // optional property
      source: 'source'
    };

    validator.validateModel(image, 'Image').then(result => {
      expect(result.errors).to.length(1);

      let error: IValidationError = result.errors[0];
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Image');
      expect(error.trace[1].stepName).to.equals('type');

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a swagger polymorphed image', (done) => {
    let medium = {
      type: 'Image',
      owner: 'John Cena', // optional property
      source: 'source' // property only exists within image
    };

    validator.validateModel(medium, 'Medium').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a swagger polymorphed video', (done) => {
    let medium = {
      type: 'Video',
      length: 123 // property only exists within video
    };

    validator.validateModel(medium, 'Medium').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a swagger polymorphed image within an array', (done) => {
    let mediums = [
      {
        type: 'Image',
        owner: 'John Cena', // optional property
        source: 'source' // property only exists within image
      },
      {
        type: 'Video',
        length: 123 // property only exists within video
      }
    ];

    validator.validateModel(mediums, 'Mediums').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should invalidate a missing required property within a swagger polymorphed object', (done) => {
    let medium = {
      type: 'Image'
    };

    validator.validateModel(medium, 'Medium').then(result => {
      expect(result.errors).to.length(1);

      let error: IValidationError = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.MISSING_REQUIRED_PROPERTY);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Medium');
      expect(error.trace[0].concreteModel).to.equals('Image');
      expect(error.trace[1].stepName).to.equals('source');

      done();
    }).catch(err => done(new Error(err)));

  });

  it('should invalidate a property mismatch within a swagger polymorphed object', (done) => {
    let medium2 = {
      type: 'Video',
      length: 'Not a length'
    };

    validator.validateModel(medium2, 'Medium').then(result => {
      expect(result.errors).to.length(1);

      let error = result.errors[0];
      expect(error.errorType).to.equals(ValidationErrorType.TYPE_MISMATCH);
      expect(error.trace).to.length(2);
      expect(error.trace[0].stepName).to.equals('Medium');
      expect(error.trace[0].concreteModel).to.equals('Video');
      expect(error.trace[1].stepName).to.equals('length');

      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate a custom polymorphed text section', (done) => {
    let section = {
      sectionType: 'TEXT_SECTION',
      textContent: 'Custom polymorphed text section'
    };

    validator.validateModel(section, 'Section').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));

  });

  it('should validate a custom polymorphed image section', (done) => {
    let section = {
      sectionType: 'IMAGE_SECTION',
      imageSource: 'whatever'
    };

    validator.validateModel(section, 'Section').then(result => {
      expect(result.errors).to.empty;

      done();
    }).catch(err => done(new Error(err)));

  });

  it('should invalidate a custom wrongly polymorphed image section', (done) => {
    let section = {
      sectionType: 'IMAGE_SECTION',
      textContent: 'Custom polymorphed text section'
    };

    validator.validateModel(section, 'Section').then(result => {
      expect(result.errors).to.length(2);

      expect(result.errors[0].errorType).to.equals(ValidationErrorType.MISSING_REQUIRED_PROPERTY);
      expect(result.errors[1].errorType).to.equals(ValidationErrorType.ADDITIONAL_PROPERTY);

      done();
    }).catch(err => done(new Error(err)));


  });

  it('should validate allOf inheritance', (done) => {
    let hamster = {
      id: 123,
      name: 'Fred',
      hungry: true
    }

    validator.validateModel(hamster, 'Hamster').then(result => {
      expect(result.errors).to.length(0);

      done();
    }).catch(err => done(new Error(err)));


  });

});
