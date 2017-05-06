"use strict";
const Promise = require("bluebird");
const result_1 = require("../result");
const pushError_1 = require("../helpers/pushError");
function validateEnum(test, schema, spec, config, trace) {
    let errors = [];
    if (schema.enum.indexOf(test) === -1) {
        pushError_1.pushError({
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
