"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDate = void 0;
var Promise = require("bluebird");
var pushError_1 = require("../helpers/pushError");
var result_1 = require("../result");
function validateDate(test, schema, spec, config, trace) {
    var errors = [];
    var correctFormat;
    if (schema.format === 'date') {
        correctFormat = fullDate(test);
    }
    else {
        correctFormat = dateTime(test);
    }
    if (!correctFormat) {
        (0, pushError_1.pushError)({
            trace: trace,
            errorType: result_1.ValidationErrorType.DATE_FORMAT
        }, errors, test, schema, spec, config);
    }
    return Promise.resolve(errors);
}
exports.validateDate = validateDate;
function dateFullYear(test) {
    return test.length === 4;
}
function dateMonth(test) {
    var month = parseInt(test);
    return test.length === 2 && month > 0 && month < 13;
}
function dateMDay(test) {
    var day = parseInt(test);
    return test.length === 2 && day > 0 && day < 32;
}
function timeHour(test) {
    var hour = parseInt(test);
    return test.length === 2 && hour >= 0 && hour < 24;
}
function timeMinute(test) {
    var minute = parseInt(test);
    return test.length === 2 && minute >= 0 && minute < 60;
}
function timeSecond(test) {
    var second = parseInt(test);
    return test.length === 2 && second >= 0 && second < 61;
}
function timeSecFrac(test) {
    if (test === undefined) {
        return true;
    }
    if (test.substr(0, 1) !== '.') {
        return false;
    }
    return test.length >= 2;
}
function timeNumOffset(test) {
    var firstChar = test.substr(0, 1);
    if (firstChar !== '+' && firstChar !== '-') {
        return false;
    }
    var params = test.substr(1).split(':');
    if (!params || params.length !== 2) {
        return false;
    }
    return timeHour(params[0]) && timeMinute(params[1]);
}
function timeOffset(test) {
    var firstChar = test.substr(0, 1);
    if (firstChar === 'Z' || firstChar === 'z') {
        return true;
    }
    return timeNumOffset(test);
}
function partialTime(test) {
    var params = test.split(':');
    if (!params || params.length !== 3) {
        return false;
    }
    var fragment;
    var indexOfDot = params[2].indexOf('.');
    if (indexOfDot !== -1) {
        fragment = params[2].substr(indexOfDot);
        params[2] = params[2].substr(0, indexOfDot);
    }
    return timeHour(params[0]) && timeMinute(params[1]) && timeSecond(params[2]) && timeSecFrac(fragment);
}
function fullDate(test) {
    var params = test.split('-');
    if (!params || params.length !== 3) {
        return false;
    }
    return dateFullYear(params[0]) && dateMonth(params[1]) && dateMDay(params[2]);
}
function fullTime(test) {
    var params = splitAtEither(test, ['Z', 'z', '+', '-']);
    if (!params || params.length !== 2) {
        return false;
    }
    return partialTime(params[0]) && timeOffset(params[1]);
}
function dateTime(test) {
    var params;
    if (test.indexOf('T') !== -1) {
        params = test.split('T');
    }
    else {
        params = test.split('t');
    }
    if (!params || params.length !== 2) {
        return false;
    }
    return fullDate(params[0]) && fullTime(params[1]);
}
function splitAtEither(input, splitStrings) {
    for (var i = 0; i < splitStrings.length; i++) {
        var splitString = splitStrings[i];
        var index = input.indexOf(splitString);
        if (index !== -1) {
            var before_1 = input.substr(0, index);
            var after_1 = input.substr(index);
            return [before_1, after_1];
        }
    }
}
