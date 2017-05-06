"use strict";
const Promise = require("bluebird");
const getTypeName_1 = require("../helpers/getTypeName");
const EnumValidator_1 = require("./EnumValidator");
const ArrayValidator_1 = require("./ArrayValidator");
const GenericValidator_1 = require("./GenericValidator");
const NumberValidator_1 = require("./NumberValidator");
const ObjectValidator_1 = require("./ObjectValidator");
const DateValidator_1 = require("./DateValidator");
const StringValidator_1 = require("./StringValidator");
const loader_1 = require("../helpers/loader");
function validateModel(test, schema, spec, config, trace) {
    if (!trace) {
        trace = [];
    }
    if (schema.$ref) {
        return loader_1.loadSchema(schema, spec, config)
            .then((schema) => validateModel(test, schema, spec, config, trace));
    }
    let errors = [];
    let validator = GenericValidator_1.validateType;
    if (schema.enum) {
        validator = EnumValidator_1.validateEnum;
    }
    return validator(test, schema, spec, config, trace)
        .then(errors => {
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
                case 'array':
                    validator = ArrayValidator_1.validateArray;
                    break;
                default:
                    return Promise.reject(`Type ${schema.type} not yet implemented (in ${schema.title})`);
            }
        }
        return (validator ? validator(test, schema, spec, config, trace) : Promise.resolve([]))
            .then(errors => {
            if (config.customValidation) {
                return new Promise((resolve, reject) => {
                    let ret = config.customValidation(test, schema, spec, trace, errors, resolve, reject);
                    if (Array.isArray(ret)) {
                        resolve(ret);
                    }
                })
                    .then(customErrors => errors.concat(customErrors));
            }
            else {
                return errors;
            }
        });
    });
}
exports.validateModel = validateModel;
