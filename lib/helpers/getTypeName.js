"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeName = void 0;
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
