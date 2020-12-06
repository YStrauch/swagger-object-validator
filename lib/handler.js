"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Handler = void 0;
var Promise = require("bluebird");
var loader_1 = require("./helpers/loader");
var result_1 = require("./result");
var ModelValidator_1 = require("./validators/ModelValidator");
__exportStar(require("./result"), exports);
var Handler = (function () {
    function Handler(swaggerSpec, config) {
        config = config || {};
        if (config.partialsDir === undefined) {
            config.partialsDir = process.cwd();
        }
        if (config.disableUniqueItemsOver === undefined) {
            config.disableUniqueItemsOver = 100;
        }
        this.config = config;
        this.swaggerSpec = loader_1.loader(swaggerSpec, config);
    }
    Handler.prototype.validateModel = function (test, schema, cb, trace) {
        var promise = this.startValidation(test, schema, trace);
        if (cb) {
            promise
                .then(function (result) {
                cb(undefined, result);
            })
                .catch(function (err) {
                cb(err);
            });
        }
        return promise;
    };
    Handler.prototype.startValidation = function (test, schema, trace) {
        var _this = this;
        var schemaPromise;
        return this.swaggerSpec.then(function (spec) {
            if (!trace) {
                trace = [];
            }
            if (typeof (schema) === 'string') {
                if (!spec) {
                    throw new Error('Received a model name or path but no Swagger Spec!');
                }
                trace.push({
                    stepName: schema
                });
                if (schema.startsWith('#/')) {
                    schemaPromise = loader_1.loadSchema(loader_1.resolveInternalPath(schema, spec), spec, _this.config);
                }
                else {
                    schemaPromise = loader_1.loadSchemaByName(schema, spec, _this.config);
                }
            }
            else {
                trace.push({
                    stepName: 'root'
                });
                schemaPromise = Promise.resolve(schema);
            }
            return schemaPromise
                .then(function (schema) { return ModelValidator_1.validateModel(test, schema, spec, _this.config, trace); })
                .then(function (errors) { return new result_1.ValidationResult(errors); });
        });
    };
    return Handler;
}());
exports.Handler = Handler;
;
