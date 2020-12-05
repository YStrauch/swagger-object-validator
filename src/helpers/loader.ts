import * as Promise from 'bluebird';
import { existsSync, readFile } from 'fs';
import { ClientRequest, get as httpGet, IncomingMessage } from 'http';
import { get as httpsGet } from 'https';
import { safeLoad } from 'js-yaml';
import * as path from 'path';
import * as Swagger from 'swagger-schema-official';
import { IValidatorConfig, IValidatorDebugConfig } from '../configuration-interfaces/validator-config';


let HTTPCache: {
  [url: string]: Promise<string>
} = {};

export interface ILoadCB {
  (error: any, spec?: Swagger.Spec): void;
}

type Primitive = boolean | number | string | null | undefined;
interface IObject {
  [key: string]: IObject | Primitive;
}

function splitPath(descriptor: string) {
  // Splits a schema descriptor at #/
  const hashPos = descriptor.indexOf('#/');
  if (hashPos !== -1) {
    const fileName = descriptor.substr(0, hashPos);
    const path = descriptor.substr(hashPos);

    return [fileName, path];
  }

  return [descriptor, undefined];
}

export function loader(input: Swagger.Spec | string, config: IValidatorConfig): Promise<Swagger.Spec> {
  if (typeof (input) === 'string') {
    return <Promise<Swagger.Spec>> _loadFromString(input, config);
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

export function resolveInternalPath(path: string, obj: IObject | Swagger.Schema): IObject {
  if (!path.startsWith('#/')) {
    throw new Error(`Path ${path} not a hashed path`);
  }

  path = path.substr(2);

  const components = path.split('/');

  let location: any = obj;
  for (let component of components) {
    if (!(location instanceof Object)) {
      throw new Error(`Path ${path} could not be found in spec, ${component} could not be resolved`);
    }
    if (!location.hasOwnProperty(component)) {
      throw new Error(`Path ${path} could not be found in spec, ${component} could not be resolved`);
    }
    location = location[component];
  }

  return location;
}


export function loadSchema(schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema> {
  if (!schema.$ref) {
    return Promise.resolve(schema);
  }

  return _loadFromString(schema.$ref, config, spec).then(dereferencedSchema => replaceRef(schema, dereferencedSchema));
}

// function loadLocalSchema(schema: Swagger.Schema, spec: Swagger.Spec, config: IValidatorConfig): Promise<Swagger.Schema> {
//   if (schema.$ref.indexOf('#/') === 0) {
//     return loadSchema(resolveInternalPath(schema.$ref, spec), spec, config);
//   }

//   return loader(join(config.partialsDir, schema.$ref), config)
//     .then(dereferencedSchema => replaceRef(schema, dereferencedSchema));
// }

// after a reference was loaded, replace it so it won't be dereferenced twice
function replaceRef(schema: Swagger.Schema, dereferencedSchema: Swagger.Schema) {
  delete schema.$ref;

  for (let propertyName in dereferencedSchema) {
    if (dereferencedSchema.hasOwnProperty(propertyName)) {
      (<any>schema)[propertyName] = (<any>dereferencedSchema)[propertyName];
    }
  }

  return schema;
}

function _loadFromString(fullPath: string, config: IValidatorConfig, spec?: Swagger.Spec): Promise<Swagger.Spec | Swagger.Schema> {
  let [filePath, internalPath] = splitPath(fullPath);
  const extension = path.extname(filePath);

  let contents: Promise<any>;
  if (!filePath) {
    // Internal Reference
    if (!internalPath) {
      return Promise.reject(`Invalid path: ${fullPath}`);
    }
    if (!spec) {
      return Promise.reject(`Missing Spec to resolve ${fullPath} against`);
    }
    // Only a #/reference
    return loadSchema(resolveInternalPath(internalPath, spec), spec, config);
  } else if (_needsDownload(filePath)) {
    // Download
    contents = _download(filePath, config);
  } else {
    // Local File System
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(process.cwd(), config.partialsDir || '', filePath);
    } else {
      filePath = path.resolve(filePath);
    }

    if (!existsSync || !readFile) {
      return Promise.reject('Cannot read file system, seems like you are using this module in frontend');
    }
    if (!existsSync(filePath)) {
      return Promise.reject(`File ${filePath} does not exist`);
    }

    contents = new Promise((resolve, reject) => {
      readFile(filePath, 'utf-8', (err, file) => {
        if (err) {
          reject(`Error loading file ${filePath}`);
        } else {
          resolve(file);
        }
      });
    });
  }

  // Parse json / yaml to object
  if (extension === '.json') {
    contents = contents.then(file => JSON.parse(file));
  } else if (extension === '.yaml' || extension === '.yml') {
    contents = contents.then(file => <any> safeLoad(file));
  } else {
    return Promise.reject(`File extension ${extension} is not supported`);
  }

  // Resolve inner path if needed
  if (internalPath) {
    contents = contents.then(obj => resolveInternalPath(internalPath, obj))
  }

  return contents;
}

function _needsDownload(path: string) {
  return path.indexOf('http://') === 0 || path.indexOf('https://') === 0;
}

function _download(url: string, config: IValidatorDebugConfig) {
  if (!config.disableDownloadCache && HTTPCache[url]) {
    // doing this after throwing the exception, or else we can have stupid race conditions while testing
    return HTTPCache[url];
  }

  let downloadMethod: (options: any, callback?: (res: IncomingMessage) => void) => ClientRequest;

  if (url.indexOf('http://') === 0) {
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

  let loadPromise = new Promise<string>((resolve, reject) => {
    downloadMethod(url, (response) => _downloadStarted(response, config, resolve, reject))
      .on('error', function (err: any) {
        if (!config.disableDownloadCache) {
          delete HTTPCache[url];
        }
        return reject(err.message);
      });
  });

  if (!config.disableDownloadCache) {
    HTTPCache[url] = loadPromise;
  }

  return loadPromise;
}

function _downloadStarted(response: IncomingMessage, config: IValidatorConfig, resolve: (result: any) => void, reject: (err: any) => void) {
  response.setEncoding('utf8');
  let file = '';
  response.on('data', (chunk: any) => {
    file += chunk;
  });
  response.on('end', () => {
    resolve(file);
  });
}
