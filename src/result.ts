export enum ValidationErrorType {
  MISSING_REQUIRED_PROPERTY = 'MISSING_REQUIRED_PROPERTY',
  ADDITIONAL_PROPERTY = 'ADDITIONAL_PROPERTY',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  ENUM_MISMATCH = 'ENUM_MISMATCH',
  DATE_FORMAT = 'DATE_FORMAT',
  CONSTRAINTS_VIOLATION = 'CONSTRAINTS_VIOLATION',
  CUSTOM = 'CUSTOM'
}

export enum ConstraintName {
  minItems = 'minItems',
  maxItems = 'maxItems',
  uniqueItems = 'uniqueItems',
  maximum = 'maximum',
  minimum = 'minimum',
  multipleOf = 'multipleOf',
  minLength = 'minLength',
  maxLength = 'maxLength',
  pattern = 'pattern',
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

export function getTraceString(trace: Array<ITraceStep>) {
  return trace.map(
    (traceStep) => {
      let traceString = traceStep.stepName;
      if (traceStep.arrayPos !== undefined) {
        traceString += `[${traceStep.arrayPos}]`;
      }
      if (traceStep.concreteModel !== undefined) {
        traceString += `<${traceStep.concreteModel}>`;
      }

      return traceString;
    }
  ).join('/');
}

export class ValidationResult {
  constructor(public errors: Array<IValidationError>) { };

  public humanReadable(): String {
    if (this.errors.length === 0) {
      return 'Valid';
    }

    let ret: Array<string> = [];

    this.errors.forEach((error) => {
      switch (error.errorType) {
        case ValidationErrorType.MISSING_REQUIRED_PROPERTY:
          ret.push('Missing required property:');
          ret.push(`\t - At ${getTraceString(error.trace)}`);
          break;

        case ValidationErrorType.TYPE_MISMATCH:
          let typeValidationError: ITypeValidationError = error;

          ret.push('Type mismatch:');
          ret.push(`\t - At ${getTraceString(error.trace)}`);
          ret.push(`\t - Should be: "${typeValidationError.typeShouldBe}"`);
          ret.push(`\t - Is: "${typeValidationError.typeIs}"`);

          break;

        case ValidationErrorType.ENUM_MISMATCH:
          let enumValidationError: IEnumValidationError = error;

          ret.push('Enum mismatch:');
          ret.push(`\t - At ${getTraceString(error.trace)}`);
          ret.push(`\t - Should be one of: ["${enumValidationError.enumShouldBe.join('", "')}"]`);
          ret.push(`\t - Is: "${enumValidationError.enumIs}"`);
          break;

        case ValidationErrorType.ADDITIONAL_PROPERTY:
          ret.push('Additional Property:');
          ret.push(`\t - At ${getTraceString(error.trace)}`);
          break;

        case ValidationErrorType.DATE_FORMAT:
          ret.push('Date format mismatch:');
          ret.push(`\t - At ${getTraceString(error.trace)}`);
          break;

        case ValidationErrorType.CONSTRAINTS_VIOLATION:
          let violationError: IConstraintsError = <IConstraintsError>error;
          ret.push('Constraint violation:');
          ret.push(`\t - Violation: ${violationError.constraintName}<${violationError.constraintValue}>`);
          ret.push(`\t - At ${getTraceString(error.trace)}`);
          break;

        case ValidationErrorType.CUSTOM:
          let customValidationError: ICustomValidationError = error;

          ret.push('Custom Error:');
          ret.push(`\t - At ${getTraceString(customValidationError.trace)}`);
          if (customValidationError.content) {
            ret.push(`\t - Content: ${JSON.stringify(customValidationError.content)}`);
          }
          break;

        default:
          ret.push('Unknown Error:');
          ret.push(`\t - At ${getTraceString(error.trace)}`);
          break;
      }

      ret.push('');
    });

    return ret.join('\n');
  }
}
