"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSchema = exports.resolveInternalPath = exports.loadSchemaByName = exports.loader = void 0;
var Promise = require("bluebird");
var fs_1 = require("fs");
var http_1 = require("http");
var https_1 = require("https");
var js_yaml_1 = require("js-yaml");
var path = require("path");
var getTypeName_1 = require("./getTypeName");
var HTTPCache = {};
function splitPath(descriptor) {
    var hashPos = descriptor.indexOf('#/');
    if (hashPos !== -1) {
        var fileName = descriptor.substr(0, hashPos);
        var path_1 = descriptor.substr(hashPos);
        return [fileName, path_1];
    }
    return [descriptor, undefined];
}
function loader(input, config) {
    if (typeof (input) === 'string') {
        return _loadFromString(input, config);
    }
    else if (!input) {
        return Promise.resolve(null);
    }
    else {
        var spec = JSON.parse(JSON.stringify(input));
        spec = convertRefsToAbsolute(config.partialsDir, spec);
        return Promise.resolve(spec);
    }
}
exports.loader = loader;
function loadSchemaByName(schemaName, spec, config) {
    var schema = spec.definitions[schemaName];
    if (!schema) {
        throw new Error("Schema ".concat(schemaName, " not found in definitions"));
    }
    return loadSchema(schema, spec, config);
}
exports.loadSchemaByName = loadSchemaByName;
function resolveInternalPath(path, obj) {
    if (!path.startsWith('#/')) {
        throw new Error("Path ".concat(path, " not a hashed path"));
    }
    path = path.substr(2);
    var components = path.split('/');
    var location = obj;
    for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
        var component = components_1[_i];
        if (!(location instanceof Object)) {
            throw new Error("Path ".concat(path, " could not be found in spec, ").concat(component, " could not be resolved"));
        }
        if (!location.hasOwnProperty(component)) {
            throw new Error("Path ".concat(path, " could not be found in spec, ").concat(component, " could not be resolved"));
        }
        location = location[component];
    }
    return location;
}
exports.resolveInternalPath = resolveInternalPath;
function loadSchema(schema, spec, config) {
    if (!schema.$ref) {
        return Promise.resolve(schema);
    }
    return _loadFromString(schema.$ref, config, spec).then(function (dereferencedSchema) { return replaceRef(schema, dereferencedSchema); });
}
exports.loadSchema = loadSchema;
function replaceRef(schema, dereferencedSchema) {
    delete schema.$ref;
    for (var propertyName in dereferencedSchema) {
        if (dereferencedSchema.hasOwnProperty(propertyName)) {
            schema[propertyName] = dereferencedSchema[propertyName];
        }
    }
    return schema;
}
function _loadFromString(fullPath, config, spec) {
    var _a = splitPath(fullPath), filePath = _a[0], internalPath = _a[1];
    var extension = path.extname(filePath);
    var childCwd = config.partialsDir;
    var contents;
    if (!filePath) {
        if (!internalPath) {
            return Promise.reject("Invalid path: ".concat(fullPath));
        }
        if (!spec) {
            return Promise.reject("Missing Spec to resolve ".concat(fullPath, " against"));
        }
        return loadSchema(resolveInternalPath(internalPath, spec), spec, config);
    }
    else if (_needsDownload(filePath)) {
        contents = _download(filePath, config);
    }
    else {
        if (!path.isAbsolute(filePath)) {
            filePath = path.join(config.partialsDir, filePath);
        }
        childCwd = path.dirname(filePath);
        if (!fs_1.existsSync || !fs_1.readFile) {
            return Promise.reject('Cannot read file system, seems like you are using this module in frontend');
        }
        if (!(0, fs_1.existsSync)(filePath)) {
            return Promise.reject("File ".concat(filePath, " does not exist"));
        }
        contents = new Promise(function (resolve, reject) {
            (0, fs_1.readFile)(filePath, 'utf-8', function (err, file) {
                if (err) {
                    reject("Error loading file ".concat(filePath));
                }
                else {
                    resolve(file);
                }
            });
        });
    }
    if (extension === '.json') {
        contents = contents.then(function (file) { return JSON.parse(file); });
    }
    else if (extension === '.yaml' || extension === '.yml') {
        contents = contents.then(function (file) { return (0, js_yaml_1.load)(file); });
    }
    else {
        return Promise.reject("File extension ".concat(extension, " is not supported"));
    }
    contents = contents.then(function (obj) { return convertRefsToAbsolute(childCwd, obj); });
    if (internalPath) {
        contents = contents.then(function (obj) { return resolveInternalPath(internalPath, obj); });
    }
    return contents;
}
function convertRefsToAbsolute(cwd, obj) {
    if (!cwd.endsWith('/')) {
        cwd += '/';
    }
    switch ((0, getTypeName_1.getTypeName)(obj)) {
        case 'array':
            for (var _i = 0, _a = obj; _i < _a.length; _i++) {
                var prop = _a[_i];
                convertRefsToAbsolute(cwd, prop);
            }
            break;
        case 'object':
            if (obj.hasOwnProperty('$ref')) {
                var ref = obj['$ref'];
                if (!_needsDownload(ref) && !ref.startsWith('/') && !ref.startsWith('#/')) {
                    obj['$ref'] = cwd + obj['$ref'];
                }
            }
            for (var propertyName in obj) {
                convertRefsToAbsolute(cwd, obj[propertyName]);
            }
            break;
        default:
            break;
    }
    return obj;
}
function _needsDownload(path) {
    return path.indexOf('http://') === 0 || path.indexOf('https://') === 0;
}
function _download(url, config) {
    if (!config.disableDownloadCache && HTTPCache[url]) {
        return HTTPCache[url];
    }
    var downloadMethod;
    if (url.indexOf('http://') === 0) {
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
    var loadPromise = new Promise(function (resolve, reject) {
        downloadMethod(url, function (response) { return _downloadStarted(response, config, resolve, reject); })
            .on('error', function (err) {
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
function _downloadStarted(response, config, resolve, reject) {
    response.setEncoding('utf8');
    var file = '';
    response.on('data', function (chunk) {
        file += chunk;
    });
    response.on('end', function () {
        resolve(file);
    });
}
