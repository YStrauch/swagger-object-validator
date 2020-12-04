"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateArray = void 0;
var Promise = require("bluebird");
var ModelValidator_1 = require("./ModelValidator");
var result_1 = require("../result");
var pushError_1 = require("../helpers/pushError");
var duplicates_1 = require("../helpers/duplicates");
function validateArray(test, schema, spec, config, trace) {
    var errors = [];
    if (!Array.isArray(test)) {
        return Promise.resolve([
            {
                errorType: result_1.ValidationErrorType.TYPE_MISMATCH,
                trace: trace,
                typeShouldBe: 'array',
                typeIs: typeof test
            }
        ]);
    }
    if (schema.minItems && test.length < schema.minItems) {
        pushError_1.pushError({
            errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
            trace: trace,
            constraintName: 'minItems',
            constraintValue: schema.minItems
        }, errors, test, schema, spec, config);
    }
    if (schema.maxItems && test.length > schema.maxItems) {
        pushError_1.pushError({
            errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
            trace: trace,
            constraintName: 'maxItems',
            constraintValue: schema.maxItems
        }, errors, test, schema, spec, config);
    }
    if (schema.uniqueItems) {
        if (test.length > config.disableUniqueItemsOver) {
            if (!config.suppressUniqueItemsWarning) {
                console.warn('The Swagger Spec specifies a uniqueItem constraint on an array of length ' + test.length + ' which is more than the max size of ' + config.disableUniqueItemsOver + '. The constraint will NOT be checked. You can change the cap and disable this message in your validator config. Further warnings of this type will be suppressed.');
                config.suppressUniqueItemsWarning = true;
            }
        }
        else if (duplicates_1.hasDuplicates(test)) {
            pushError_1.pushError({
                errorType: result_1.ValidationErrorType.CONSTRAINTS_VIOLATION,
                trace: trace,
                constraintName: 'uniqueItems',
                constraintValue: schema.uniqueItems
            }, errors, test, schema, spec, config);
        }
    }
    var promises = [];
    test.forEach(function (entry, index) {
        var newTrace = JSON.parse(JSON.stringify(trace));
        newTrace[newTrace.length - 1].arrayPos = index;
        var items = [];
        if (Array.isArray(schema.items)) {
            items = schema.items;
        }
        else {
            items = [schema.items];
        }
        items.forEach(function (item) {
            promises.push(ModelValidator_1.validateModel(entry, item, spec, config, newTrace));
        });
    });
    return Promise.all(promises)
        .then(function (childErrors) { return childErrors.reduce(function (a, b) {
        return a.concat(b);
    }, errors); });
}
exports.validateArray = validateArray;
;
