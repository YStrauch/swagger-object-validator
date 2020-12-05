"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationResult = exports.getTraceString = exports.ConstraintName = exports.ValidationErrorType = void 0;
var ValidationErrorType;
(function (ValidationErrorType) {
    ValidationErrorType["MISSING_REQUIRED_PROPERTY"] = "MISSING_REQUIRED_PROPERTY";
    ValidationErrorType["ADDITIONAL_PROPERTY"] = "ADDITIONAL_PROPERTY";
    ValidationErrorType["TYPE_MISMATCH"] = "TYPE_MISMATCH";
    ValidationErrorType["ENUM_MISMATCH"] = "ENUM_MISMATCH";
    ValidationErrorType["DATE_FORMAT"] = "DATE_FORMAT";
    ValidationErrorType["CONSTRAINTS_VIOLATION"] = "CONSTRAINTS_VIOLATION";
    ValidationErrorType["CUSTOM"] = "CUSTOM";
})(ValidationErrorType = exports.ValidationErrorType || (exports.ValidationErrorType = {}));
var ConstraintName;
(function (ConstraintName) {
    ConstraintName["minItems"] = "minItems";
    ConstraintName["maxItems"] = "maxItems";
    ConstraintName["uniqueItems"] = "uniqueItems";
    ConstraintName["maximum"] = "maximum";
    ConstraintName["minimum"] = "minimum";
    ConstraintName["multipleOf"] = "multipleOf";
    ConstraintName["minLength"] = "minLength";
    ConstraintName["maxLength"] = "maxLength";
    ConstraintName["pattern"] = "pattern";
})(ConstraintName = exports.ConstraintName || (exports.ConstraintName = {}));
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
