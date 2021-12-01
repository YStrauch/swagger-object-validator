"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateModel = void 0;
var Promise = require("bluebird");
var allOf_1 = require("../helpers/allOf");
var getTypeName_1 = require("../helpers/getTypeName");
var loader_1 = require("../helpers/loader");
var ArrayValidator_1 = require("./ArrayValidator");
var DateValidator_1 = require("./DateValidator");
var EnumValidator_1 = require("./EnumValidator");
var GenericValidator_1 = require("./GenericValidator");
var NumberValidator_1 = require("./NumberValidator");
var ObjectValidator_1 = require("./ObjectValidator");
var StringValidator_1 = require("./StringValidator");
function validateModel(test, schema, spec, config, trace) {
    if (!trace) {
        trace = [];
    }
    if (schema.allOf && schema.allOf.length) {
        return allOf_1.extendAllAllOfs(schema, config, spec)
            .then(function (schema) { return validateResolvedModel(test, schema, spec, config, trace); });
    }
    return validateResolvedModel(test, schema, spec, config, trace);
}
exports.validateModel = validateModel;
function validateResolvedModel(test, schema, spec, config, trace) {
    if (schema.$ref) {
        return loader_1.loadSchema(schema, spec, config)
            .then(function (schema) { return validateResolvedModel(test, schema, spec, config, trace); });
    }
    var errors = [];
    var validator = GenericValidator_1.validateType;
    if (schema.enum) {
        validator = EnumValidator_1.validateEnum;
    }
    // add allOf check and loopback to validation again
    if (schema.allOf && schema.allOf.length && !schema.properties) {
        return validateModel(test, schema, spec, config, trace);
    }
    return validator(test, schema, spec, config, trace)
        .then(function (errors) {
        if (errors.length) {
            return errors;
        }
        validator = undefined;
        if (schema.additionalProperties || schema.properties || (schema.type && schema.type === 'object')) {
            validator = ObjectValidator_1.validateObject;
        }
        else {
            switch (getTypeName_1.getTypeName(test)) {
                case 'string':
                    if (schema.format === 'date' || schema.format === 'date-time') {
                        validator = DateValidator_1.validateDate;
                    }
                    else {
                        validator = StringValidator_1.validateString;
                    }
                    break;
                case 'boolean':
                    break;
                case 'number':
                    validator = NumberValidator_1.validateNumber;
                    break;
                case 'null':
                    break;
                case 'array':
                    validator = ArrayValidator_1.validateArray;
                    break;
                default:
                    return Promise.reject("Type " + schema.type + " not yet implemented (in " + schema.title + ")");
            }
        }
        return (validator ? validator(test, schema, spec, config, trace) : Promise.resolve([]))
            .then(function (errors) {
            if (config.customValidation) {
                return new Promise(function (resolve, reject) {
                    var ret = config.customValidation(test, schema, spec, trace, errors, resolve, reject);
                    if (Array.isArray(ret)) {
                        resolve(ret);
                    }
                })
                    .then(function (customErrors) { return errors.concat(customErrors); });
            }
            else {
                return errors;
            }
        });
    });
}
