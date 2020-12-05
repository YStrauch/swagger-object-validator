import * as chai from 'chai';
import { join } from 'path';
import { Handler } from '../src/handler';

const expect = chai.expect;


let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');
let validator = new Handler(yaml, { partialsDir: dir });

describe('ObjectValidator', () => {
  it('should validate a correct pet', (done) => {
    let pet = {
      id: 123,
      name: 'Doge'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    })
      .catch(err => {
        done(new Error(err));
      });
  });

  it('should validate a correct pet with optional attributes', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      tag: 'Much Doge, such Tag'
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    })
      .catch(err => {
        done(new Error(err));
      });
  });

  it('should validate a correct self referencing pet', (done) => {
    let pet = {
      id: 123,
      name: 'Doge',
      children: [
        {
          id: 1234,
          name: 'Doge Junior'
        }
      ]
    };

    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;

      done();
    })
      .catch(err => {
        done(new Error(err));
      });
  });
});
