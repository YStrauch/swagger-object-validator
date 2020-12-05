import * as Promise from 'bluebird';
import { ISpec, ISchema} from '../specs'
import { IValidatorConfig } from '../validator-config';
import { pushError } from '../helpers/pushError';
import { ITraceStep, IValidationError, ValidationErrorType } from '../result';


export function validateDate(test: any, schema: ISchema, spec: ISpec, config: IValidatorConfig, trace: Array<ITraceStep>): Promise<Array<IValidationError>> {
  let errors: Array<IValidationError> = [];

  // validates full-date or date-time as specified in ISO8601
  // NOTE: it will not check for semantic mistakes like February 30th!

  // this is what ISO8601 specifies:
  //  date-fullyear   = 4DIGIT
  //  date-month      = 2DIGIT  ; 01-12
  //  date-mday       = 2DIGIT  ; 01-28, 01-29, 01-30, 01-31 based on
  //                            ; month/year
  //  time-hour       = 2DIGIT  ; 00-23
  //  time-minute     = 2DIGIT  ; 00-59
  //  time-second     = 2DIGIT  ; 00-58, 00-59, 00-60 based on leap second
  //                            ; rules
  //  time-secfrac    = "." 1*DIGIT
  //  time-numoffset  = ("+" / "-") time-hour ":" time-minute
  //  time-offset     = "Z" / time-numoffset

  //  partial-time    = time-hour ":" time-minute ":" time-second
  //                    [time-secfrac]
  //  full-date       = date-fullyear "-" date-month "-" date-mday
  //  full-time       = partial-time time-offset

  //  date-time       = full-date "T" full-time

  let correctFormat: boolean;
  if (schema.format === 'date') {
    correctFormat = fullDate(test);
  } else {
    correctFormat = dateTime(test);
  }

  if (!correctFormat) {
    pushError({
      trace: trace,
      errorType: ValidationErrorType.DATE_FORMAT
    }, errors, test, schema, spec, config);
  }


  return Promise.resolve(errors);
}

function dateFullYear(test: string) {
  return test.length === 4;
}

function dateMonth(test: string) {
  let month = parseInt(test);
  return test.length === 2 && month > 0 && month < 13;
}

function dateMDay(test: string) {
  let day = parseInt(test);
  return test.length === 2 && day > 0 && day < 32;
}
function timeHour(test: string) {
  let hour = parseInt(test);
  return test.length === 2 && hour >= 0 && hour < 24;
}

function timeMinute(test: string) {
  let minute = parseInt(test);
  return test.length === 2 && minute >= 0 && minute < 60;
}

function timeSecond(test: string) {
  let second = parseInt(test);
  return test.length === 2 && second >= 0 && second < 61; // 61 because of leap second
}

function timeSecFrac(test?: string) {
  if (test === undefined) {
    return true;
  }

  if (test.substr(0, 1) !== '.') {
    return false;
  }

  return test.length >= 2;
}

function timeNumOffset(test: string) {
  let firstChar = test.substr(0, 1);
  if (firstChar !== '+' && firstChar !== '-') {
    return false;
  }

  // slice away + or - and split at :
  let params = test.substr(1).split(':');
  if (!params || params.length !== 2) {
    return false;
  }

  return timeHour(params[0]) && timeMinute(params[1]);
}

function timeOffset(test: string) {
  let firstChar = test.substr(0, 1);
  if (firstChar === 'Z' || firstChar === 'z') {
    return true;
  }
  return timeNumOffset(test);
}

function partialTime(test: string) {
  let params = test.split(':');
  if (!params || params.length !== 3) {
    return false;
  }

  let fragment: string;
  let indexOfDot = params[2].indexOf('.');

  if (indexOfDot !== -1) {
    fragment = params[2].substr(indexOfDot);
    params[2] = params[2].substr(0, indexOfDot);
  }

  return timeHour(params[0]) && timeMinute(params[1]) && timeSecond(params[2]) && timeSecFrac(fragment);
}

function fullDate(test: string) {
  let params = test.split('-');
  if (!params || params.length !== 3) {
    return false;
  }

  return dateFullYear(params[0]) && dateMonth(params[1]) && dateMDay(params[2]);
}

function fullTime(test: string) {
  // fullTime is partialTime and timeOffset without any seperator
  // timeOffset starts with either Z, z, +, or -

  let params = splitAtEither(test, ['Z', 'z', '+', '-']);
  if (!params || params.length !== 2) {
    return false;
  }

  return partialTime(params[0]) && timeOffset(params[1]);
}

function dateTime(test: string) {
  let params: Array<string>;
  if (test.indexOf('T') !== -1) {
    params = test.split('T');
  } else {
    params = test.split('t');
  }
  if (!params || params.length !== 2) {
    return false;
  }

  return fullDate(params[0]) && fullTime(params[1]);
}


function splitAtEither(input: string, splitStrings: Array<string>) {
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
