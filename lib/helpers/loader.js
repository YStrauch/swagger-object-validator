"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchema = exports.loadSchemaByName = exports.loader = void 0;
var Promise = require("bluebird");
var fs_1 = require("fs");
var http_1 = require("http");
var https_1 = require("https");
var js_yaml_1 = require("js-yaml");
var path_1 = require("path");
var cache = {};
function loader(input, config) {
    if (typeof (input) === 'string') {
        return _loadSwaggerSpecFromString(input, config);
    }
    else if (!input) {
        return Promise.resolve(null);
    }
    else {
        return Promise.resolve(JSON.parse(JSON.stringify(input)));
    }
}
exports.loader = loader;
function loadSchemaByName(schemaName, spec, config) {
    var schema = spec.definitions[schemaName];
    if (!schema) {
        throw new Error("Schema " + schemaName + " not found in definitions");
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
            .then(function (loadedSchemaOrSpec) {
            var internalPath = schema.$ref.substr(schema.$ref.indexOf('#'));
            if (!internalPath) {
                return loadedSchemaOrSpec;
            }
            var loadedSpec = loadedSchemaOrSpec;
            if (!loadedSpec.host) {
                loadedSpec.host = schema.$ref.substr(0, schema.$ref.indexOf('/'));
            }
            var newSchema = JSON.parse(JSON.stringify(schema));
            newSchema.$ref = internalPath;
            return loadLocalSchema(newSchema, loadedSpec, config);
        });
    }
    return loadLocalSchema(schema, spec, config);
}
exports.loadSchema = loadSchema;
function loadLocalSchema(schema, spec, config) {
    if (schema.$ref.charAt(0) === '.') {
        var path = [];
        if (spec.schemes) {
            if (spec.schemes.indexOf('https') !== -1) {
                path.push('https://');
            }
            else if (spec.schemes.indexOf('http') !== -1) {
                path.push('http://');
            }
            else {
                return Promise.reject("Method " + JSON.stringify(spec.schemes) + " are not supported (supported is only HTTP and HTTPS)");
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
        return loader(path_1.join.apply(void 0, __spreadArrays(path, [config.partialsDir, schema.$ref])), config)
            .then(function (dereferencedSchema) { return replaceRef(schema, dereferencedSchema); });
    }
    if (schema.$ref.indexOf('#/definitions') === 0) {
        var definitionName = schema.$ref.substr(14);
        return loadSchemaByName(definitionName, spec, config);
    }
    return Promise.reject("$ref " + schema.$ref + " cannot be resolved");
}
function replaceRef(schema, dereferencedSchema) {
    delete schema.$ref;
    for (var propertyName in dereferencedSchema) {
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
    var extension = path_1.extname(path);
    if (!path_1.isAbsolute(path)) {
        path = path_1.resolve(process.cwd(), path);
    }
    else {
        path = path_1.resolve(path);
    }
    if (!fs_1.existsSync) {
        return Promise.reject('Cannot read file system, seems like you are using this module in frontend');
    }
    if (!fs_1.existsSync(path)) {
        return Promise.reject("File " + path + " does not exist");
    }
    if (extension === '.json') {
        return new Promise(function (resolve, reject) {
            if (!fs_1.readFile) {
                reject('Cannot read file system, seems like you are using this module in frontend');
            }
            fs_1.readFile(path, 'utf-8', function (err, file) {
                if (err) {
                    return reject('Error loading JSON file');
                }
                else {
                    return resolve(JSON.parse(file));
                }
            });
        });
    }
    else if (extension === '.yaml' || extension === '.yml') {
        return new Promise(function (resolve, reject) {
            fs_1.readFile(path, 'utf-8', function (err, file) {
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
        return Promise.reject("File extension " + extension + " is not supported");
    }
}
function _needsDownload(path) {
    return path.indexOf('http://') === 0 || path.indexOf('https://') === 0;
}
function _download(path, config) {
    var extension = path_1.extname(path);
    if (!extension) {
        extension = path_1.extname(path.substr(0, path.indexOf('#')));
    }
    var downloadMethod;
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
    var url = path.substr(0, path.indexOf('#'));
    if (cache[url]) {
        return cache[url];
    }
    var loadPromise = new Promise(function (resolve, reject) {
        downloadMethod(path, function (response) { return _downloadStarted(response, extension, config, resolve, reject); })
            .on('error', function (err) {
            return reject(err.message);
        });
    });
    cache[url] = loadPromise;
    return loadPromise;
}
function _downloadStarted(response, extension, config, resolve, reject) {
    response.setEncoding('utf8');
    var file = '';
    response.on('data', function (chunk) {
        file += chunk;
    });
    response.on('end', function () {
        if (extension === '.yaml' || extension === '.yml') {
            resolve(js_yaml_1.safeLoad(file));
        }
        else if (extension === '.json') {
            resolve(JSON.parse(file));
        }
        else {
            reject("File extension " + extension + " is not supported");
        }
    });
}
