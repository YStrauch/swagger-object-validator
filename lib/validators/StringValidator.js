"use strict";
var Promise = require("bluebird");
var result_1 = require("../result");
var pushError_1 = require("../helpers/pushError");
function validateString(test, schema, spec, config, trace) {
    var errors = [];
    if (schema.minLength && test.length < schema.minLength) {
        pushError_1.pushError({
            errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
            trace: trace,
            constraintName: 'minLength',
            constraintValue: schema.minLength
        }, errors, test, schema, spec, config);
    }
    if (schema.maxLength && test.length > schema.maxLength) {
        pushError_1.pushError({
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
            pushError_1.pushError({
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
