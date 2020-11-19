"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var Promise = require("bluebird");
var loader_1 = require("./helpers/loader");
var ModelValidator_1 = require("./validators/ModelValidator");
var result_1 = require("./result");
__export(require("./result"));
var Handler = (function () {
    function Handler(swaggerSpec, config) {
        config = config || {};
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
                    throw new Error('Received a model name(?) but no Swagger Spec!');
                }
                trace.push({
                    stepName: schema
                });
                schemaPromise = loader_1.loadSchemaByName(schema, spec, _this.config);
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
