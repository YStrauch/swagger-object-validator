"use strict";
const Promise = require("bluebird");
const getTypeName_1 = require("../helpers/getTypeName");
const result_1 = require("../result");
const pushError_1 = require("../helpers/pushError");
function validateType(test, schema, spec, config, trace) {
    let errors = [];
    let typeIs = getTypeName_1.getTypeName(test);
    let typeShouldBe;
    if (schema.additionalProperties || schema.properties || (schema.type && schema.type === 'object')) {
        typeShouldBe = 'object';
    }
    else if (schema.type) {
        typeShouldBe = schema.type;
    }
    else if (!schema.type) {
        return Promise.reject(`Schema is corrupted (no schema/type), schema is ${JSON.stringify(schema)}`);
    }
    else {
        debugger;
        return Promise.reject(`Schema should be of type "${typeShouldBe}", which is unknown or not yet implemented`);
    }
    if (typeShouldBe === 'integer') {
        typeShouldBe = 'number';
    }
    if (typeIs !== typeShouldBe) {
        pushError_1.pushError({
            trace: trace,
            errorType: result_1.ValidationErrorType.TYPE_MISMATCH,
            typeIs: typeIs,
            typeShouldBe: typeShouldBe,
        }, errors, test, schema, spec, config);
    }
    return Promise.resolve(errors);
}
exports.validateType = validateType;
