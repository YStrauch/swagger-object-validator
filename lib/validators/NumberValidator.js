"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNumber = void 0;
var Promise = require("bluebird");
var pushError_1 = require("../helpers/pushError");
var result_1 = require("../result");
function validateNumber(test, schema, spec, config, trace) {
    var errors = [];
    if (!schema.format) {
        if (schema.type === 'integer') {
            schema.format = 'int64';
        }
        else if (schema.type === 'number') {
            schema.format = 'double';
        }
    }
    var testIsInteger = test === parseInt(test + '', 10);
    if (testIsInteger) {
        var testIsS32 = test > -2147483649 && test < 2147483648;
        if (!testIsS32 && schema.format === 'int32') {
            (0, pushError_1.pushError)({
                errorType: result_1.ValidationErrorType.TYPE_MISMATCH,
                trace: trace,
                typeShouldBe: 'integer<signed_int32>',
                typeIs: 'integer<signed_int64>'
            }, errors, test, schema, spec, config);
        }
    }
    else {
        var isFloat = void 0;
        if (test === 0) {
            isFloat = true;
        }
        else if (test > 0) {
            isFloat = test > 1.5E-45 && test < 3.4E38;
        }
        else {
            isFloat = test < -1.5E-45 && test > -3.4E38;
        }
        var typeIs = "number<".concat(isFloat ? 'float' : 'double', ">");
        if (schema.type === 'integer') {
            (0, pushError_1.pushError)({
                errorType: result_1.ValidationErrorType.TYPE_MISMATCH,
                trace: trace,
                typeShouldBe: "integer<".concat(schema.format, ">"),
                typeIs: typeIs
            }, errors, test, schema, spec, config);
        }
        if (!isFloat && schema.format === 'float') {
            (0, pushError_1.pushError)({
                errorType: result_1.ValidationErrorType.TYPE_MISMATCH,
                trace: trace,
                typeShouldBe: "number<".concat(schema.format, ">"),
                typeIs: typeIs
            }, errors, test, schema, spec, config);
        }
    }
    if (schema.maximum !== undefined) {
        if (schema.exclusiveMaximum && test >= schema.maximum || !schema.exclusiveMaximum && test > schema.maximum) {
            (0, pushError_1.pushError)({
                errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
                trace: trace,
                constraintName: 'maximum',
                constraintValue: schema.maximum
            }, errors, test, schema, spec, config);
        }
    }
    if (schema.minimum !== undefined) {
        if (schema.exclusiveMinimum && test <= schema.minimum || !schema.exclusiveMinimum && test < schema.minimum) {
            (0, pushError_1.pushError)({
                errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
                trace: trace,
                constraintName: 'minimum',
                constraintValue: schema.minimum
            }, errors, test, schema, spec, config);
        }
    }
    if (schema.multipleOf && test % schema.multipleOf !== 0) {
        (0, pushError_1.pushError)({
            errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
            trace: trace,
            constraintName: 'multipleOf',
            constraintValue: schema.multipleOf
        }, errors, test, schema, spec, config);
    }
    return Promise.resolve(errors);
}
exports.validateNumber = validateNumber;
