export declare enum ValidationErrorType {
    MISSING_REQUIRED_PROPERTY = "MISSING_REQUIRED_PROPERTY",
    ADDITIONAL_PROPERTY = "ADDITIONAL_PROPERTY",
    TYPE_MISMATCH = "TYPE_MISMATCH",
    ENUM_MISMATCH = "ENUM_MISMATCH",
    DATE_FORMAT = "DATE_FORMAT",
    CONSTRAINTS_VIOLATION = "CONSTRAINTS_VIOLATION",
    CUSTOM = "CUSTOM"
}
export declare enum ConstraintName {
    minItems = "minItems",
    maxItems = "maxItems",
    uniqueItems = "uniqueItems",
    maximum = "maximum",
    minimum = "minimum",
    multipleOf = "multipleOf",
    minLength = "minLength",
    maxLength = "maxLength",
    pattern = "pattern"
}
export interface IValidationError {
    errorType: ValidationErrorType;
    trace: Array<ITraceStep>;
}
export interface ITypeValidationError extends IValidationError {
    typeShouldBe?: string;
    typeIs?: string;
}
export interface IEnumValidationError extends IValidationError {
    enumIs?: string;
    enumShouldBe?: Array<string>;
}
export interface IConstraintsError extends IValidationError {
    constraintName: ConstraintName;
    constraintValue: number | string | boolean;
}
export interface ICustomValidationError extends IValidationError {
    content?: any;
}
export interface ITraceStep {
    stepName: string;
    arrayPos?: number;
    concreteModel?: string;
}
export declare function getTraceString(trace: Array<ITraceStep>): string;
export declare class ValidationResult {
    errors: Array<IValidationError>;
    constructor(errors: Array<IValidationError>);
    errorsWithStringTypes(): Array<IValidationError>;
    humanReadable(): String;
}
