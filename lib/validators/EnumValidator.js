"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnum = void 0;
var Promise = require("bluebird");
var pushError_1 = require("../helpers/pushError");
var result_1 = require("../result");
function validateEnum(test, schema, spec, config, trace) {
    var errors = [];
    if (schema.enum.indexOf(test) === -1) {
        (0, pushError_1.pushError)({
            errorType: result_1.ValidationErrorType.ENUM_MISMATCH,
            trace: trace,
            enumIs: test,
            enumShouldBe: schema.enum
        }, errors, test, schema, spec, config);
    }
    return Promise.resolve(errors);
}
exports.validateEnum = validateEnum;
;
