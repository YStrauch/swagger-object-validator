import { Handler } from '../src/handler';
import { ValidationErrorType, ITypeValidationError, ICustomValidationError } from '../src/result';
import { IValidatorConfig } from '../src/configuration-interfaces/validator-config';

import * as chai from 'chai';
import * as mocha from 'mocha';
const expect = chai.expect;

import { join } from 'path';

let dir = join(__dirname, 'specs', 'yaml');
let yaml = join(dir, 'swagger.yaml');

describe('ObjectValidator', () => {
  it('should allow polymorphic classes to be be an abstract class themselves', (done) => {
    let spec = {
      'swagger': '2.0',
      'info': {
        'version': '1.0.0',
        'title': 'Multi-Polymorphism'
      },
      'paths': {
        '/pets': {
          'get': {
            'responses': {
              '200': {
                'description': 'Poly-Element',
                'schema': {
                  '$ref': '#/definitions/Element'
                }
              }
            }
          }
        }
      },
      'definitions': {
        'Element': {
          'description': 'Element Schema.\n',
          'required': [
            'id',
            'elementType'
          ],
          'discriminator': 'elementType',
          'properties': {
            'id': {
              'type': 'integer',
              'format': 'int64'
            },
            'elementType': {
              'type': 'string',
              'description': 'Element type name',
              'enum': [
                'video',
                'extension'
              ]
            }
          }
        },
        'Video': {
          'description': 'Video (Element) Schema.\n',
          'allOf': [
            {
              '$ref': '#/definitions/Element'
            }
          ],
          'properties': {
            'elementType': {
              'type': 'string',
              'enum': [
                'video'
              ]
            },
            'caption': {
              'type': 'string'
            }
          }
        },
        'Extension': {
          'description': 'Extension (Element) Schema.\n',
          'required': [
            'extensionType'
          ],
          'allOf': [
            {
              '$ref': '#/definitions/Element'
            }
          ],
          'discriminator': 'extensionType',
          'properties': {
            'elementType': {
              'type': 'string',
              'enum': [
                'extension'
              ]
            },
            'extensionType': {
              'type': 'string',
              'enum': [
                'videoExtension',
                'photoExtension'
              ]
            }
          }
        },
        'VideoExtension': {
          'description': 'VideoExtension Schema.\n',
          'allOf': [
            {
              '$ref': '#/definitions/Extension'
            }
          ],
          'properties': {
            'elementType': {
              'type': 'string',
              'enum': [
                'extension'
              ]
            },
            'extensionType': {
              'type': 'string',
              'enum': [
                'videoExtension'
              ]
            },
            'htmlContent': {
              'type': 'string'
            }
          }
        },
        'PhotoExtension': {
          'description': 'PhotoExtension Schema.\n',
          'allOf': [
            {
              '$ref': '#/definitions/Extension'
            }
          ],
          'properties': {
            'elementType': {
              'type': 'string',
              'enum': [
                'extension'
              ]
            },
            'extensionType': {
              'type': 'string',
              'enum': [
                'photoExtension'
              ]
            },
            'image': {
              'type': 'string'
            }
          }
        }
      }
    };

    let element = {
      'id': 0,
      'elementType': 'extension',
      'extensionType': 'videoExtension',
      'htmlContent': 123
    };


    let validator = new Handler(spec);
    validator.validateModel(element, 'Element').then(result => {
      expect(result.errors).to.length(1);
      expect(result.errors[0].errorType === ValidationErrorType.TYPE_MISMATCH);
      expect(result.errors[0].trace.length === 3);

      done();
    }).catch(err => done(new Error(err)));
  });

});
