"use strict";
function getTypeName(test) {
    if (test === null) {
        return 'null';
    }
    if (Array.isArray(test)) {
        return 'array';
    }
    return typeof (test);
}
exports.getTypeName = getTypeName;
