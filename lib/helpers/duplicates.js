"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasDuplicates = exports.deepEqual = void 0;
;
function deepEqual(x, y, xParents, yParents) {
    if (!xParents || !yParents) {
        xParents = [];
        yParents = [];
    }
    if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
        return true;
    }
    if (x === y) {
        return true;
    }
    if ((typeof (x) === 'string' || typeof (y) === 'string') ||
        (typeof (x) === 'boolean' || typeof (y) === 'boolean') ||
        (typeof (x) === 'number' || typeof (y) === 'number') ||
        (x === null || y === null) ||
        (x === undefined || y === undefined)) {
        return false;
    }
    if (Array.isArray(x) || Array.isArray(y)) {
        if ((Array.isArray(x) && Array.isArray(y))) {
            if (x.length === y.length) {
                for (var i = 0; i < x.length; i++) {
                    if (deepEqual(x[i], y[i], xParents, yParents) === false) {
                        return false;
                    }
                }
                return true;
            }
        }
        return false;
    }
    if (!(x instanceof Object && y instanceof Object)) {
        throw Error('Object comparison failed, ' + typeof (x) + ' is not an allowed type');
    }
    if (xParents.indexOf(x) > -1 || yParents.indexOf(y) > -1) {
        throw Error('Object comparison failed, circular loop detected');
    }
    for (var p in y) {
        if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
            return false;
        }
        if (typeof y[p] !== typeof x[p]) {
            return false;
        }
    }
    for (var p in x) {
        if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
            return false;
        }
        if (typeof y[p] !== typeof x[p]) {
            return false;
        }
        switch (typeof (x[p])) {
            case 'object':
            case 'function':
                xParents.push(x);
                yParents.push(y);
                if (!deepEqual(x[p], y[p], xParents, yParents)) {
                    return false;
                }
                xParents.pop();
                yParents.pop();
                break;
            default:
                if (x[p] !== y[p]) {
                    return false;
                }
                break;
        }
    }
    return true;
}
exports.deepEqual = deepEqual;
function hasDuplicates(items) {
    for (var i1 = 0; i1 < items.length; i1++) {
        var xParents = [];
        for (var i2 = i1 + 1; i2 < items.length; i2++) {
            var yParents = [];
            if (deepEqual(items[i1], items[i2], xParents, yParents)) {
                return true;
            }
        }
    }
    return false;
}
exports.hasDuplicates = hasDuplicates;
