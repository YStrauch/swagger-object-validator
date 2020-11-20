"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationResult = exports.getTraceString = exports.ValidationErrorType = void 0;
var ValidationErrorType;
(function (ValidationErrorType) {
    ValidationErrorType[ValidationErrorType["MISSING_REQUIRED_PROPERTY"] = 0] = "MISSING_REQUIRED_PROPERTY";
    ValidationErrorType[ValidationErrorType["ADDITIONAL_PROPERTY"] = 1] = "ADDITIONAL_PROPERTY";
    ValidationErrorType[ValidationErrorType["TYPE_MISMATCH"] = 2] = "TYPE_MISMATCH";
    ValidationErrorType[ValidationErrorType["ENUM_MISMATCH"] = 3] = "ENUM_MISMATCH";
    ValidationErrorType[ValidationErrorType["DATE_FORMAT"] = 4] = "DATE_FORMAT";
    ValidationErrorType[ValidationErrorType["CONSTRAINTS_VIOLATION"] = 5] = "CONSTRAINTS_VIOLATION";
    ValidationErrorType[ValidationErrorType["CUSTOM"] = 6] = "CUSTOM";
})(ValidationErrorType = exports.ValidationErrorType || (exports.ValidationErrorType = {}));
function getTraceString(trace) {
    return trace.map(function (traceStep) {
        var traceString = traceStep.stepName;
        if (traceStep.arrayPos !== undefined) {
            traceString += "[" + traceStep.arrayPos + "]";
        }
        if (traceStep.concreteModel !== undefined) {
            traceString += "<" + traceStep.concreteModel + ">";
        }
        return traceString;
    }).join('/');
}
exports.getTraceString = getTraceString;
var ValidationResult = (function () {
    function ValidationResult(errors) {
        this.errors = errors;
    }
    ;
    ValidationResult.prototype.errorsWithStringTypes = function () {
        return this.errors.map(function (error) {
            error = JSON.parse(JSON.stringify(error));
            error.errorType = ValidationErrorType[error.errorType];
            return error;
        });
    };
    ValidationResult.prototype.humanReadable = function () {
        if (this.errors.length === 0) {
            return 'Valid';
        }
        var ret = [];
        this.errors.forEach(function (error) {
            switch (error.errorType) {
                case ValidationErrorType.MISSING_REQUIRED_PROPERTY:
                    ret.push('Missing required property:');
                    ret.push("\t - At " + getTraceString(error.trace));
                    break;
                case ValidationErrorType.TYPE_MISMATCH:
                    var typeValidationError = error;
                    ret.push('Type mismatch:');
                    ret.push("\t - At " + getTraceString(error.trace));
                    ret.push("\t - Should be: \"" + typeValidationError.typeShouldBe + "\"");
                    ret.push("\t - Is: \"" + typeValidationError.typeIs + "\"");
                    break;
                case ValidationErrorType.ENUM_MISMATCH:
                    var enumValidationError = error;
                    ret.push('Enum mismatch:');
                    ret.push("\t - At " + getTraceString(error.trace));
                    ret.push("\t - Should be one of: [\"" + enumValidationError.enumShouldBe.join('", "') + "\"]");
                    ret.push("\t - Is: \"" + enumValidationError.enumIs + "\"");
                    break;
                case ValidationErrorType.ADDITIONAL_PROPERTY:
                    ret.push('Additional Property:');
                    ret.push("\t - At " + getTraceString(error.trace));
                    break;
                case ValidationErrorType.DATE_FORMAT:
                    ret.push('Date format mismatch:');
                    ret.push("\t - At " + getTraceString(error.trace));
                    break;
                case ValidationErrorType.CONSTRAINTS_VIOLATION:
                    var violationError = error;
                    ret.push('Constraint violation:');
                    ret.push("\t - Violation: " + violationError.constraintName + "<" + violationError.constraintValue + ">");
                    ret.push("\t - At " + getTraceString(error.trace));
                    break;
                case ValidationErrorType.CUSTOM:
                    var customValidationError = error;
                    ret.push('Custom Error:');
                    ret.push("\t - At " + getTraceString(customValidationError.trace));
                    if (customValidationError.content) {
                        ret.push("\t - Content: " + JSON.stringify(customValidationError.content));
                    }
                    break;
                default:
                    ret.push('Unknown Error:');
                    ret.push("\t - At " + getTraceString(error.trace));
                    break;
            }
            ret.push('');
        });
        return ret.join('\n');
    };
    return ValidationResult;
}());
exports.ValidationResult = ValidationResult;
