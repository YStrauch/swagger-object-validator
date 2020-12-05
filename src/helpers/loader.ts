import * as Promise from 'bluebird';
import { existsSync, readFile } from 'fs';
import { ClientRequest, get as httpGet, IncomingMessage } from 'http';
import { get as httpsGet } from 'https';
import { safeLoad } from 'js-yaml';
import { extname, isAbsolute, join, resolve } from 'path';
import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig } from '../configuration-interfaces/validator-config';


let cache: {
  [url: string]: Promise<Swagger.Spec>
} = {};


export interface ILoadCB {
  (error: any, spec?: Swagger.Spec): void;
}

export function loader(input: Swagger.Spec | string, config: IValidatorConfig): Promise<Swagger.Spec> {
  if (typeof (input) === 'string') {
    return _loadSwaggerSpecFromString(input, config);
  } else if (!input) {
    return Promise.resolve(null);
  } else {
    return Promise.resolve(JSON.parse(JSON.stringify(input)));
  }
}

// find a schema by name
export function loadSchemaByName(schemaName: string, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema> {
  let schema = spec.definitions[schemaName];
  if (!schema) {
    throw new Error(`Schema ${schemaName} not found in definitions`);
  }
  return loadSchema(schema, spec, config);
}


export function loadSchema(schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema> {
  if (!schema.$ref) {
    return Promise.resolve(schema);
  }

  if (_needsDownload(schema.$ref)) {
    return _download(schema.$ref, config)
      .then((loadedSchemaOrSpec: Swagger.Schema | Swagger.Spec) => {
        // the url may have a hash that describes the internal path within the downloaded document
        let internalPath = schema.$ref.substr(schema.$ref.indexOf('#'));
        if (!internalPath) {
          // no hash means this is a schema not a spec
          return loadedSchemaOrSpec;
        }
        let loadedSpec = <Swagger.Spec>loadedSchemaOrSpec;
        if (!loadedSpec.host) {
          loadedSpec.host = schema.$ref.substr(0, schema.$ref.indexOf('/'));
        }

        // we have a swagger spec
        // replace the URL in $ref
        let newSchema = JSON.parse(JSON.stringify(schema));
        newSchema.$ref = internalPath;
        return loadLocalSchema(newSchema, loadedSpec, config);
      });
  }

  return loadLocalSchema(schema, spec, config);
}

function loadLocalSchema(schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema> {
  if (schema.$ref.charAt(0) === '.') {
    let path: Array<string> = [];
    // TODO: the whole relative to a server is not tested and surely won't work!
    if (spec.schemes) {
      if (spec.schemes.indexOf('https') !== -1) {
        path.push('https://');
      } else if (spec.schemes.indexOf('http') !== -1) {
        path.push('http://');
      } else {
        return Promise.reject(`Method ${JSON.stringify(spec.schemes)} are not supported (supported is only HTTP and HTTPS)`);
      }
    }
    if (spec.host) {
      if (!spec.schemes) {
        spec.schemes.push('https://');
      }
      path.push(spec.host);
      if (spec.basePath) {
        path.push(spec.basePath);
      }
    }

    return loader(join(...path, config.partialsDir, schema.$ref), config)
      .then(dereferencedSchema => replaceRef(schema, dereferencedSchema));
  }

  if (schema.$ref.indexOf('#/definitions') === 0) {
    let definitionName = schema.$ref.substr(14);
    return loadSchemaByName(definitionName, spec, config);
  }
  return Promise.reject(`$ref ${schema.$ref} cannot be resolved`);
}

// after a reference was loaded, replace it so it won't be dereferenced twice
function replaceRef(schema: Swagger.Schema, dereferencedSchema: Swagger.Schema) {
  delete schema.$ref;

  for (let propertyName in dereferencedSchema) {
    if (dereferencedSchema.hasOwnProperty(propertyName)) {
      (<any>schema)[propertyName] = (<any>dereferencedSchema)[propertyName];
    }
  }

  return (schema);
}

function _loadSwaggerSpecFromString(path: string, config: IValidatorConfig): Promise<Swagger.Spec> {
  if (_needsDownload(path)) {
    return _download(path, config);
  }

  let extension = extname(path);

  if (!isAbsolute(path)) {
    path = resolve(process.cwd(), path);
  } else {
    path = resolve(path);
  }

  if (!existsSync) {
    return Promise.reject('Cannot read file system, seems like you are using this module in frontend');
  }

  if (!existsSync(path)) {
    return Promise.reject(`File ${path} does not exist`);
  }


  if (extension === '.json') {
    return new Promise<Swagger.Spec>((resolve, reject) => {
      if (!readFile) {
        reject('Cannot read file system, seems like you are using this module in frontend');
      }

      readFile(path, 'utf-8', (err, file) => {
        if (err) {
          return reject('Error loading JSON file');
        } else {
          return resolve(JSON.parse(file));
        }
      });
    });

  } else if (extension === '.yaml' || extension === '.yml') {
    return new Promise((resolve, reject) => {
      readFile(path, 'utf-8', (err, file) => {
        if (err) {
          return reject('Error loading yaml file');
        } else {
          return resolve(<Swagger.Spec>safeLoad(file));
        }
      });
    });
  } else {
    return Promise.reject(`File extension ${extension} is not supported`);
  }
}

function _needsDownload(path: string) {
  return path.indexOf('http://') === 0 || path.indexOf('https://') === 0;
}

function _download(path: string, config: IValidatorConfig): Promise<any> {
  let extension = extname(path);
  if (!extension) {
    // a url may have a hash to seperate the external and internal URL
    extension = extname(path.substr(0, path.indexOf('#')));
  }

  let downloadMethod: (options: any, callback?: (res: IncomingMessage) => void) => ClientRequest;

  if (path.indexOf('http://') === 0) {
    if (config.disallowHttp) {
      return Promise.reject('Definition needs HTTP, which is disallowed');
    }
    downloadMethod = httpGet;
  } else {
    if (config.disallowHttps) {
      return Promise.reject('Definition needs HTTPS, which is disallowed');
    }

    downloadMethod = httpsGet;
  }

  let url = path.substr(0, path.indexOf('#'));
  if (cache[url]) {
    return cache[url];
  }

  let loadPromise = new Promise<Swagger.Spec>((resolve, reject) => {
    downloadMethod(path, (response) => _downloadStarted(response, extension, config, resolve, reject))
      .on('error', function (err: any) {
        return reject(err.message);
      });
  });

  cache[url] = loadPromise;
  return loadPromise;
}

function _downloadStarted(response: IncomingMessage, extension: String, config: IValidatorConfig, resolve: (result: any) => void, reject: (err: any) => void) {
  response.setEncoding('utf8');
  let file = '';
  response.on('data', (chunk: any) => {
    file += chunk;
  });
  response.on('end', () => {
    if (extension === '.yaml' || extension === '.yml') {
      resolve(safeLoad(file));
    } else if (extension === '.json') {
      resolve(JSON.parse(file));
    } else {
      reject(`File extension ${extension} is not supported`);
    }
  });
}
