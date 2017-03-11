"use strict";
const result_1 = require("../result");
const pushError_1 = require("../helpers/pushError");
function validateDate(test, schema, spec, config, trace) {
    let errors = [];
    let correctFormat;
    if (schema.format === 'date') {
        correctFormat = fullDate(test);
    }
    else {
        correctFormat = dateTime(test);
    }
    if (!correctFormat) {
        pushError_1.pushError({
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
    let month = parseInt(test);
    return test.length === 2 && month > 0 && month < 13;
}
function dateMDay(test) {
    let day = parseInt(test);
    return test.length === 2 && day > 0 && day < 32;
}
function timeHour(test) {
    let hour = parseInt(test);
    return test.length === 2 && hour >= 0 && hour < 24;
}
function timeMinute(test) {
    let minute = parseInt(test);
    return test.length === 2 && minute >= 0 && minute < 60;
}
function timeSecond(test) {
    let second = parseInt(test);
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
    let firstChar = test.substr(0, 1);
    if (firstChar !== '+' && firstChar !== '-') {
        return false;
    }
    let params = test.substr(1).split(':');
    if (params.length !== 2) {
        return false;
    }
    return timeHour(params[0]) && timeMinute(params[1]);
}
function timeOffset(test) {
    let firstChar = test.substr(0, 1);
    if (firstChar === 'Z' || firstChar === 'z') {
        return true;
    }
    return timeNumOffset(test);
}
function partialTime(test) {
    let params = test.split(':');
    if (params.length !== 3) {
        return false;
    }
    let fragment;
    let indexOfDot = params[2].indexOf('.');
    if (indexOfDot !== -1) {
        fragment = params[2].substr(indexOfDot);
        params[2] = params[2].substr(0, indexOfDot);
    }
    return timeHour(params[0]) && timeMinute(params[1]) && timeSecond(params[2]) && timeSecFrac(fragment);
}
function fullDate(test) {
    let params = test.split('-');
    if (params.length !== 3) {
        return false;
    }
    return dateFullYear(params[0]) && dateMonth(params[1]) && dateMDay(params[2]);
}
function fullTime(test) {
    let params = splitAtEither(test, ['Z', 'z', '+', '-']);
    if (params.length !== 2) {
        return false;
    }
    return partialTime(params[0]) && timeOffset(params[1]);
}
function dateTime(test) {
    let params;
    if (test.indexOf('T') !== -1) {
        params = test.split('T');
    }
    else {
        params = test.split('t');
    }
    if (params.length !== 2) {
        return false;
    }
    return fullDate(params[0]) && fullTime(params[1]);
}
function splitAtEither(input, splitStrings) {
    for (let i = 0; i < splitStrings.length; i++) {
        let splitString = splitStrings[i];
        let index = input.indexOf(splitString);
        if (index !== -1) {
            let before = input.substr(0, index);
            let after = input.substr(index);
            return [before, after];
        }
    }
}
