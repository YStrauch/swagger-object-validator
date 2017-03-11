"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
const loader_1 = require("./helpers/loader");
const ModelValidator_1 = require("./validators/ModelValidator");
const result_1 = require("./result");
__export(require("./result"));
class Handler {
    constructor(swaggerSpec, config) {
        config = config || {};
        this.config = config;
        this.swaggerSpec = loader_1.loader(swaggerSpec, config);
    }
    validateModel(test, schema, cb, trace) {
        let promise = this.startValidation(test, schema, trace);
        if (cb) {
            promise
                .then(result => {
                cb(undefined, result);
            })
                .catch(err => {
                cb(err);
            });
        }
        return promise;
    }
    startValidation(test, schema, trace) {
        let schemaPromise;
        return this.swaggerSpec.then(spec => {
            if (!trace) {
                trace = [];
            }
            if (typeof (schema) === 'string') {
                trace.push({
                    stepName: schema
                });
                schemaPromise = loader_1.loadSchemaByName(schema, spec, this.config);
            }
            else {
                schemaPromise = Promise.resolve(schema);
            }
            return schemaPromise
                .then(schema => ModelValidator_1.validateModel(test, schema, spec, this.config, trace))
                .then(errors => new result_1.ValidationResult(errors));
        });
    }
}
exports.Handler = Handler;
;
