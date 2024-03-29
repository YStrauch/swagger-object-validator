"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateType = void 0;
var Promise = require("bluebird");
var getTypeName_1 = require("../helpers/getTypeName");
var pushError_1 = require("../helpers/pushError");
var result_1 = require("../result");
function validateType(test, schema, spec, config, trace) {
    var errors = [];
    var typeIs = (0, getTypeName_1.getTypeName)(test);
    var typeShouldBe;
    if (schema.additionalProperties || schema.properties || (schema.type && schema.type === 'object')) {
        typeShouldBe = 'object';
    }
    else if (schema.type) {
        typeShouldBe = schema.type;
    }
    else if (!schema.type) {
        return Promise.reject("Schema is corrupted (no schema/type), schema is ".concat(JSON.stringify(schema)));
    }
    else {
        debugger;
        return Promise.reject("Schema should be of type \"".concat(typeShouldBe, "\", which is unknown or not yet implemented"));
    }
    if (typeShouldBe === 'integer') {
        typeShouldBe = 'number';
    }
    if (config.allowXNullable === true && typeIs === 'null' && schema['x-nullable'] === true) {
        typeShouldBe = 'null';
    }
    if (typeIs !== typeShouldBe) {
        (0, pushError_1.pushError)({
            trace: trace,
            errorType: result_1.ValidationErrorType.TYPE_MISMATCH,
            typeIs: typeIs,
            typeShouldBe: typeShouldBe,
        }, errors, test, schema, spec, config);
    }
    return Promise.resolve(errors);
}
exports.validateType = validateType;
