"use strict";
function pushError(error, errors, value, schema, spec, config) {
    if (config.ignoreError) {
        if (config.ignoreError(error, value, schema, spec)) {
            return;
        }
    }
    errors.push(error);
}
exports.pushError = pushError;
