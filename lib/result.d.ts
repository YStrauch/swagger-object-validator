export declare enum ValidationErrorType {
    MISSING_REQUIRED_PROPERTY = 0,
    ADDITIONAL_PROPERTY = 1,
    TYPE_MISMATCH = 2,
    ENUM_MISMATCH = 3,
    DATE_FORMAT = 4,
    CONSTRAINTS_VIOLATION = 5,
    CUSTOM = 6
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
    constraintName: string;
    constraintValue: number | string;
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
