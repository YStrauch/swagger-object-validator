"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateString = void 0;
var Promise = require("bluebird");
var pushError_1 = require("../helpers/pushError");
var result_1 = require("../result");
function validateString(test, schema, spec, config, trace) {
    var errors = [];
    if (schema.minLength && test.length < schema.minLength) {
        (0, pushError_1.pushError)({
            errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
            trace: trace,
            constraintName: 'minLength',
            constraintValue: schema.minLength
        }, errors, test, schema, spec, config);
    }
    if (schema.maxLength && test.length > schema.maxLength) {
        (0, pushError_1.pushError)({
            errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
            trace: trace,
            constraintName: 'maxLength',
            constraintValue: schema.maxLength
        }, errors, test, schema, spec, config);
    }
    if (schema.pattern) {
        var pattern = schema.pattern;
        if (pattern.charAt(0) === '/' && pattern.charAt(pattern.length - 1) === '/') {
            pattern = pattern.substr(1, pattern.length - 2);
        }
        if (!(new RegExp(pattern).test(test))) {
            (0, pushError_1.pushError)({
                errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
                trace: trace,
                constraintName: 'pattern',
                constraintValue: schema.pattern
            }, errors, test, schema, spec, config);
        }
    }
    return Promise.resolve(errors);
}
exports.validateString = validateString;
