import * as chai from 'chai';
import { join } from 'path';
import { IValidatorDebugConfig } from '../src/validator-config';
import { Handler } from '../src/handler';

const expect = chai.expect;



describe('Loader', () => {
  it('should load a yaml file and validate pet by name', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let yaml = join(dir, 'swagger.yaml');
    let validator = new Handler(yaml, { partialsDir: dir });
    let pet = {
      id: 123,
      name: 'Doge'
    };
    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should load a yaml file with relative path', (done) => {
    let validator = new Handler(join('test', 'specs', 'yaml', 'swagger.yaml'));
    let pet = {
      id: 123,
      name: 'Doge'
    };
    validator.validateModel(pet, '#/definitions/Pet').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should load a yaml file and validate pet by path', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let yaml = join(dir, 'swagger.yaml');
    let validator = new Handler(yaml, { partialsDir: dir });
    let pet = {
      id: 123,
      name: 'Doge'
    };
    validator.validateModel(pet, '#/definitions/Pet').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });


  it('should load a json file and validate pet by name', (done) => {
    let dir = join(__dirname, 'specs', 'json');
    let json = join(dir, 'swagger.json');
    let validator = new Handler(json, { partialsDir: dir });
    let pet = {
      id: 123,
      name: 'Doge'
    };
    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });


  it('should load a json file and validate pet by path', (done) => {
    let dir = join(__dirname, 'specs', 'json');
    let json = join(dir, 'swagger.json');
    let validator = new Handler(json, { partialsDir: dir });
    let pet = {
      id: 123,
      name: 'Doge'
    };
    validator.validateModel(pet, '#/definitions/Pet').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });


  it('should load a JavaScript object', (done) => {
    let dir = join(__dirname, 'specs', 'json');
    let json = join(dir, 'swagger.json');
    let object = require(json);
    let validator = new Handler(object, { partialsDir: dir });
    let pet = {
      id: 123,
      name: 'Doge'
    };
    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should validate from inline array schema', (done) => {
    let validator = new Handler();

    let schema = {
      type: 'array',
      items: {
        type: 'string'
      }
    }

    let model = ['1', '2'];

    validator.validateModel(model, schema).then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should be able to validate from paths model given directly', (done) => {
    let dir = join(__dirname, 'specs', 'json');
    let json = require(join(dir, 'swagger.json'));
    let validator = new Handler(json, { partialsDir: dir });


    let model = {
      'name': 'Homer'
    };

    validator.validateModel(model, json.paths['/person'].post.parameters[0].schema).then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should be able to disallow HTTP', (done) => {
    let config = {
      disallowHttp: true
    };
    let validator = new Handler('http://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml', config);
    validator.validateModel({}, 'Pet').then(result => {
      done(new Error('No HTTP error was thrown'));
    }).catch(err => {
      expect(err).to.eq('Definition needs HTTP, which is disallowed');
      done();
    });
  });

  it('should be able to disallow HTTPS', (done) => {
    let config: IValidatorDebugConfig = {
      disallowHttps: true,
      disableDownloadCache: true
    };

    let validator = new Handler('https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml', config);
    validator.validateModel({}, 'Pet').then(result => {
      done(new Error('No HTTPS error was thrown'));
    }).catch(err => {
      expect(err).to.eq('Definition needs HTTPS, which is disallowed');
      done();
    });
  });

  it('should load a yaml via internet', (done) => {
    let validator = new Handler('https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml');
    let pet = {
      id: 123,
      name: 'Doge'
    };
    validator.validateModel(pet, 'Pet').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should load a yaml that loads refs via internet in yaml format with internal ref', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let json = join(dir, 'swagger-with-http.yaml');
    let validator = new Handler(json, { partialsDir: dir });

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

    validator.validateModel(pets, 'PetsFromYamlWithInternalRef').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });


  it('should load a yaml that loads refs via internet in json format with internal ref', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let json = join(dir, 'swagger-with-http.yaml');
    let validator = new Handler(json, { partialsDir: dir });

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

    validator.validateModel(pets, 'PetsFromJSONWithInternalRef').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should load a yaml that loads refs via internet in yaml format directly', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let json = join(dir, 'swagger-with-http.yaml');
    let validator = new Handler(json, { partialsDir: dir });

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

    validator.validateModel(pets, 'PetsFromYamlDirect').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });


  it('should load a yaml that loads refs via internet in json format directly', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let json = join(dir, 'swagger-with-http.yaml');
    let validator = new Handler(json, { partialsDir: dir });

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

    validator.validateModel(pets, 'PetsFromJSONDirect').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should understand relative paths locally', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let json = join(dir, 'swagger-with-http.yaml');
    let validator = new Handler(json, { partialsDir: dir });

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

    validator.validateModel(pets, 'PetsRelativeTo').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });

  it('should understand relative paths with internal ref locally', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let json = join(dir, 'swagger-with-http.yaml');
    let validator = new Handler(json, { partialsDir: dir });

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

    validator.validateModel(pets, 'PetsRelativeToFileSystem').then(result => {
      expect(result.errors).to.empty;
      done();
    }).catch(err => done(new Error(err)));
  });


  it('should disallow a yaml that loads refs via internet in json format when http is disallowed', (done) => {
    let dir = join(__dirname, 'specs', 'yaml');
    let json = join(dir, 'swagger-with-http.yaml');
    const config: IValidatorDebugConfig = {
      partialsDir: dir,
      disallowHttp: true,
      disallowHttps: true,
      disableDownloadCache: true
    }
    let validator = new Handler(json, config);

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

    validator.validateModel(pets, 'PetsFromJSONDirect').then(result => {
      done(new Error('No HTTPS error was thrown'));
    }).catch(err => {
      expect(err).to.eq('Definition needs HTTPS, which is disallowed');
      done();
    });
  });
});
