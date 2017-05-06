"use strict";
const Promise = require("bluebird");
const fs_1 = require("fs");
const path_1 = require("path");
const js_yaml_1 = require("js-yaml");
const http_1 = require("http");
const https_1 = require("https");
let cache = {};
function loader(input, config) {
    if (typeof (input) === 'string') {
        return _loadSwaggerSpecFromString(input, config);
    }
    else {
        return Promise.resolve(JSON.parse(JSON.stringify(input)));
    }
}
exports.loader = loader;
function loadSchemaByName(schemaName, spec, config) {
    let schema = spec.definitions[schemaName];
    if (!schema) {
        throw new Error(`Schema ${schemaName} not found in definitions`);
    }
    return loadSchema(schema, spec, config);
}
exports.loadSchemaByName = loadSchemaByName;
function loadSchema(schema, spec, config) {
    if (!schema.$ref) {
        return Promise.resolve(schema);
    }
    if (_needsDownload(schema.$ref)) {
        return _download(schema.$ref, config)
            .then((loadedSchemaOrSpec) => {
            let internalPath = schema.$ref.substr(schema.$ref.indexOf('#'));
            if (!internalPath) {
                return loadedSchemaOrSpec;
            }
            let loadedSpec = loadedSchemaOrSpec;
            if (!loadedSpec.host) {
                loadedSpec.host = schema.$ref.substr(0, schema.$ref.indexOf('/'));
            }
            let newSchema = JSON.parse(JSON.stringify(schema));
            newSchema.$ref = internalPath;
            return loadLocalSchema(newSchema, loadedSpec, config);
        });
    }
    return loadLocalSchema(schema, spec, config);
}
exports.loadSchema = loadSchema;
function loadLocalSchema(schema, spec, config) {
    if (schema.$ref.charAt(0) === '.') {
        let path = [];
        if (spec.schemes) {
            if (spec.schemes.indexOf('https') !== -1) {
                path.push('https://');
            }
            else if (spec.schemes.indexOf('http') !== -1) {
                path.push('http://');
            }
            else {
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
        return loader(path_1.join(...path, config.partialsDir, schema.$ref), config)
            .then(dereferencedSchema => replaceRef(schema, dereferencedSchema));
    }
    if (schema.$ref.indexOf('#/definitions') === 0) {
        let definitionName = schema.$ref.substr(14);
        return loadSchemaByName(definitionName, spec, config);
    }
    return Promise.reject(`$ref ${schema.$ref} cannot be resolved`);
}
function replaceRef(schema, dereferencedSchema) {
    delete schema.$ref;
    for (let propertyName in dereferencedSchema) {
        if (dereferencedSchema.hasOwnProperty(propertyName)) {
            schema[propertyName] = dereferencedSchema[propertyName];
        }
    }
    return (schema);
}
function _loadSwaggerSpecFromString(path, config) {
    if (_needsDownload(path)) {
        return _download(path, config);
    }
    let extension = path_1.extname(path);
    if (!path_1.isAbsolute(path)) {
        path = path_1.resolve(process.cwd(), path);
    }
    else {
        path = path_1.resolve(path);
    }
    if (!fs_1.existsSync(path)) {
        return Promise.reject(`File ${path} does not exist`);
    }
    if (extension === '.json') {
        return Promise.resolve(JSON.parse(JSON.stringify(require(path))));
    }
    else if (extension === '.yaml' || extension === '.yml') {
        return new Promise((resolve, reject) => {
            fs_1.readFile(path, 'utf-8', (err, file) => {
                if (err) {
                    return reject('Error loading yaml file');
                }
                else {
                    return resolve(js_yaml_1.safeLoad(file));
                }
            });
        });
    }
    else {
        return Promise.reject(`File extension ${extension} is not supported`);
    }
}
function _needsDownload(path) {
    return path.indexOf('http://') === 0 || path.indexOf('https://') === 0;
}
function _download(path, config) {
    let extension = path_1.extname(path);
    if (!extension) {
        extension = path_1.extname(path.substr(0, path.indexOf('#')));
    }
    let downloadMethod;
    if (path.indexOf('http://') === 0) {
        if (config.disallowHttp) {
            return Promise.reject('Definition needs HTTP, which is disallowed');
        }
        downloadMethod = http_1.get;
    }
    else {
        if (config.disallowHttps) {
            return Promise.reject('Definition needs HTTPS, which is disallowed');
        }
        downloadMethod = https_1.get;
    }
    let url = path.substr(0, path.indexOf('#'));
    if (cache[url]) {
        return cache[url];
    }
    let loadPromise = new Promise((resolve, reject) => {
        downloadMethod(path, (response) => _downloadStarted(response, extension, config, resolve, reject))
            .on('error', function (err) {
            return reject(err.message);
        });
    });
    cache[url] = loadPromise;
    return loadPromise;
}
function _downloadStarted(response, extension, config, resolve, reject) {
    response.setEncoding('utf8');
    let file = '';
    response.on('data', (chunk) => {
        file += chunk;
    });
    response.on('end', () => {
        if (extension === '.yaml' || extension === '.yml') {
            resolve(js_yaml_1.safeLoad(file));
        }
        else if (extension === '.json') {
            resolve(JSON.parse(file));
        }
        else {
            reject(`File extension ${extension} is not supported`);
        }
    });
}
