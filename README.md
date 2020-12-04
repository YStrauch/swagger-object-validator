# What?
Validate an Object against a given [swagger (V2.0)](http://swagger.io/specification/) API definition.
> A swagger definition specifies an API with requests and data models, and there are a lot of compilers to create server and client skeletons. There are some tools that validate the requests that were sent to the server, but surprisingly there is a huge lack of (good) validators for response bodies.

Just test it quickly and be amazed:

[![Try it on RunKit](https://badge.runkitcdn.com/swagger-object-validator.svg)](https://npm.runkit.com/swagger-object-validator)


# Why this and not some other tool?
The API is awesome, it gives you easy and full control over what's happening:
- Every error has a detailed stack trace so you can find where and what is wrong easily
- Stack traces are in a format that allows computer programs to understand what's wrong without parsing strings
- You can add your own rules or ignore certain errors
- Other tools do not like splitted specifications (via *$ref*)
- Most other tools do not implement very special constraints (like regex, int32/int64, minItems...)

# Features
## Validation
The following swagger specifications are validated:
- All the basic stuff like Numbers, Strings, Enums, Arrays, Objects
- Required properties
- Int32/Int64, Float/Double, Booleans
- Dates and Date-Times
- Maps *(additionalProperties)*
- Inheritance *(allOf)*
- Polymorphism *(discriminator)*
- Custom polymorphism that uses enums
- All kinds of references ($ref)

## Flexible API
- Load your swagger spec from a JSON/yaml file, the interwebs *or* load it yourself and do your stuff first
- Validate your object either by name or by a specification object
- Get useful **stack traces** of all the validation errors that occured
- Stack traces are readable by both programs and humans
- Need to add custom validation rules or ignore certain errors? No problem!
- TypeScript support

# Quick start

*Please ensure that the swagger spec itself is valid to prevent unexpected errors, this module does not verify the spec itself.*

Let's assume you got a pet from your pet store and want to validate it.

## Using TypeScript

```ts
import * as SwaggerValidator from 'swagger-object-validator';
let validator = new SwaggerValidator.Handler('https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml');

let pet = {
    id: 123,
    name: 'Doge'
};
validator.validateModel(pet, 'Pet', (err, result) => {
    console.log(result.humanReadable());
});

```

## Using JavaScript

```js
var swaggerValidator = require('swagger-object-validator');
var validator = new swaggerValidator.Handler('https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml');

var pet = {
    id: 123,
    name: 'Doge'
};
validator.validateModel(pet, 'Pet', function (err, result) {
    console.log(result.humanReadable());
});
```

Both will print out "Valid", since they comply to the swagger specification.

## Error Trace
So lets change our pet model to be invalid (the rest of the code remains the same):
```js
var pet = {
    id: 'This is not a number',
    foo: 'bar',
    tag: [
        'This is an optional argument, but it',
        'Should be a String, not an Array of Strings'
    ]
}
```

Now it will print out:
```
Missing required property:
	 - At Pet/name

Type mismatch:
	 - At Pet/id
	 - Should be: "number"
	 - Is: "string"

Additional Property:
	 - At Pet/foo

Type mismatch:
	 - At Pet/tag
	 - Should be: "string"
	 - Is: "array"
```

This is the **human readable** error trace, because we called `result.humanReadable()`. It will print out a full path to the error, where each step is seperated with a slash. They come quite handy if you need to find an error in a very complex model, and they support array positions and polymorphism!

The human readable trace is just a rendered version of `result.errors`, which looks like this:
```json
[
    {
        "errorType": "MISSING_REQUIRED_PROPERTY",
        "trace": [
            {
                "stepName": "Pet"
            },
            {
                "stepName": "name"
            }
        ]
    },
    {
        "errorType": "ADDITIONAL_PROPERTY",
        "trace": [
            {
                "stepName": "Pet"
            },
            {
                "stepName": "foo"
            }
        ]
    },
    {
        "trace": [
            {
                "stepName": "Pet"
            },
            {
                "stepName": "id"
            }
        ],
        "errorType": "TYPE_MISMATCH",
        "typeIs": "string",
        "typeShouldBe": "number"
    },
    {
        "trace": [
            {
                "stepName": "Pet"
            },
            {
                "stepName": "tag"
            }
        ],
        "errorType": "TYPE_MISMATCH",
        "typeIs": "array",
        "typeShouldBe": "string"
    }
]
```

If you don't like the error types as integers (which will happen if you don't use TypeScript), call `result.errorsWithStringTypes()` and all those errorTypes will be called "MISSING_REQUIRED_PROPERTY", "TYPE_MISMATCH" and "ADDITIONAL_PROPERTY".

# Ways to load a specification
## JSON/yaml/URL
You may load JSON or yaml files from your disk or from the interwebs. It doesn't matter!
```Typescript
import * as SwaggerValidator from 'swagger-object-validator';
let validator = new SwaggerValidator.Handler('https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml');
// or
let validator = new SwaggerValidator.Handler('./petstore.yaml');
// or
let validator = new SwaggerValidator.Handler('./petstore.json');
// or
let petStore = require('./petstore.json');
let validator = new SwaggerValidator.Handler(petStore);
```

## Without an entire swagger spec

Up to now we always loaded the complete Swagger Specification. Maybe you don't need that and already know the exact model spec? Just validate against a model spec directly:

```ts
import * as SwaggerValidator from 'swagger-object-validator';
let validator = new SwaggerValidator.Handler();

let spec = {
    type: "array",
    items: {
        type: "string"
    }
}

let model = ['1', '2'];
validator.validateModel(model, spec, (err, result) => {
    console.log(result.humanReadable());
});
```
## Inline models / unnamed models
If you need to validate a model against a definition that is *not* part of the *definitions* section, you can fetch the model specification like so:

```ts
import * as SwaggerValidator from 'swagger-object-validator';
let validator = new SwaggerValidator.Handler('https://raw.githubusercontent.com/YStrauch/swagger-object-validator/master/test/specs/yaml/swagger.yaml');

// Fetch the unnamed model from i.e. a path
let schema = json.paths['/person'].post.parameters[0].schema

validator.validateModel({'name': 'Homer'}, schema).then(result => {
    console.log(result.humanReadable());
});
```

# Config
You can hand in a configuration object. Before diving in each of them let's look over it quickly:
```TypeScript
interface IValidatorConfig {
  // for relative $refs, defaults to './'
  partialsDir?: string;

  // allow additional properties not defined in the Spec, defaults to false
  allowAdditionalProperties?: boolean;

  // allow usage of x-nullable for properties, defaults to false
  allowXNullable?: boolean;

  // will not check for uniqueItems constraint if there are more than this many, defaults to 100
  disableUniqueItemsOver?: number;
  // suppresses the console warning when uniqueItems was disabled due to disableUniqueItemsOver, defaults to false
  suppressUniqueItemsWarning?: boolean;

  // allow fetching of HTTP and HTTPS resources, both default to true
  disallowHttp?: boolean;
  disallowHttps?: boolean;

  // add custom validation rules (sync and async)
  customValidation?: (
    test: any,
    schema: Swagger.Schema,
    spec: Swagger.Spec,
    trace: Array<ITraceStep>,
    otherErrors: Array<ICustomValidationError>,
    resolve?: (validationErrors: ICustomValidationError[]) => void,
    reject?: (reason: string) => void
  ) => ICustomValidationError[] | void | undefined;

  // you can ignore certain errors
  ignoreError?: ( // cb to ignore errors
    error: IValidationError,
    value: any,
    schema: Swagger.Schema,
    spec: Swagger.Spec
  ) => boolean;
}
```

## Partials directory for $ref
$ref gives you the possibility to split your specification across different files (or even servers). There are multiple types of $refs:
```yaml
// internal $ref
$ref: '#/definitions/Pet'

// $ref to the interwebs
$ref: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml#/definitions/Pet'

// relative $ref
$ref: './pet.json'
```
The last kind of $refs, the relative ones, uses process.cwd() to determine the absolute path. If you want those $refs to resolve to another directory, you may specify a base path:

```TypeScript
let config = {
  partialsDir: '/some/path/'
}
let validator = new SwaggerValidator.Handler('spec.yml', config);
```

## Disallowing HTTP or HTTPs
As described in the paragraph above Swagger allows references to the interwebs. If you do not want this you can set a corresponding option:
```js
let config = {
  disallowHttp: true,
  disallowHttps: true
};
let validator = new Handler('http://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml', config);
```

## Allowing Additional properties
By default, every property that is not specified within the swagger definition adds an
ADDITIONAL_PROPERTY error to the stack. If you want to allow certain properties you can
do that with the ignoreError function (see "Ignoring Errors" below), or you can allow all additional properties at once with a config entry:

```TypeScript
let config: IValidatorConfig = {
    allowAdditionalProperties: true
};
```

## Allowing `x-nullable` properties
A common extension for Swagger 2 is `x-nullable`, based on
[`nullable` from the OpenAPI 3 spec](https://swagger.io/specification/#schemaNullable).
This allows a property to be returned as `null` instead of the intended type.

By enabling this configuration, the `x-nullable` property is recognized and respected
when validating types.

```TypeScript
let config: IValidatorConfig = {
    allowXNullable: true
};
```

## Limiting the Unique Items Constraint
Since version 1.4.0, this library implements the `uniqueItems` constraint. This constraint can be set on array specs to disallow duplicate items and emit a ConstraintViolation if needed.

Detecting duplicate items needs to compare all items pairwise, and since items can be of arbitrary depth, this could bring drastic performance bottlenecks when you have a big number of items (or very complex items).

To prevent the validator to get stuck on this, by default it will never validate arrays for uniqueness that have more than 100 elements. You can change that cap with the `disableUniqueItemsOver` in your validator config to accommodate your needs and hardware.

If the cap is exceeded, a console warning will be emitted by default. You can disable this warning by setting `suppressUniqueItemsWarning` to true in your validator config.

For example, if you want to validate unique lists of up to 300 elements, you can change the cap and disable warnings like so:

```TypeScript
let config = {
  disableUniqueItemsOver: 300,
  suppressUniqueItemsWarning: true
}
let validator = new SwaggerValidator.Handler('spec.yml', config);
```

Just remember that the algorithm will scale exponentially in the number of items.

## Ignoring errors
You may want to ignore certain errors. Let's assume you need some magic to allow a certain
string to be valid on a field that should normally be a number (because of reasons):
```TypeScript
let config: IValidatorConfig = {
    ignoreError: (error, value, schema, spec) => {
      // ignore type mismatches on Pet/id when a certain value occures
      return error.errorType === ValidationErrorType.TYPE_MISMATCH
        && error.trace[0].stepName === 'Pet'
        && error.trace[1].stepName === 'id'
        && schema.type === 'integer'
        && value === 'magicKeyThatWillBeAllowed';
    }
};
let validator = new Handler('https://raw.githubusercontent.com/OAI/OpenAPI-Specification/master/examples/v2.0/yaml/petstore.yaml', config);
let pet = {
  id: 'magicKeyThatWillBeAllowed',
  name: 'Doge'
};
validator.validateModel(pet, 'Pet', (err, result) => {
  console.log(result.humanReadable()); // valid
```

## Custom validation rules
You may need to implement custom rules, for example you may want to ensure that a pet name always starts with an uppercase letter.
*(For that specific use case you should probably just use a "pattern" regex swagger rule but for the sake of documentation we forget about this)*
```TypeScript
let config: IValidatorConfig = {
    customValidation: (test, schema, spec, trace, otherErrors) => {
      // only validate Pet/name
      if (trace.length !== 2
        || trace[trace.length - 2].stepName !== 'Pet'
        || trace[trace.length - 1].stepName !== 'name') {
        // the property is not a pet name, so do not return any validation errors
        return [];
      }

      // no need to ensure that petName is actually a string, because this will be already done for you
      let firstChar = test.substr(0,1);
      if (firstChar !== firstChar.toUpperCase()) {
        return [
          // You may throw a custom error, where content is any type
          {
            errorType: ValidationErrorType.CUSTOM, // or 6 for JS
            trace: trace,
            content: 'Name must start with an uppercase letter'
          }
        ];
      }

      // pet starts with an uppercase, so do not return validation errors
      return [];
    }
  };
```

You may either return an array of errors, or if you need to do asynchronously magic, you can use the resolve callback (or the reject callback to throw a critical error). Make sure not to mix return and resolve though.
```TypeScript
customValidation: (test, schema, spec, trace, otherErrors, resolve, reject) => {
  setTimeout(() => resolve([]), 100);
}
```

***Important:***
- Swagger-Object-Validator will run its validation logic before your custom validation is called.
If any validation error occur within that logic, your handler is **not** called.
(Would be annoying if we had to check if the name is a string right?)
- With great power comes great runtime exceptions. If you allow for example a string on
an object field to pass, the Object validator will crash because it expects
its input to be an object. This hook should be used with caution.
- Normally you should not need to implement custom rules, because you will add constraints that are not specified within the specification. Think first if you may be better on with a regex experssion, a min/max or any other swagger constraint.

# Polymorphism
Swagger-Object-Validator can work with two types of polymorphism.

## Standard polymorphism
Medium is a superclass of Image and Video. The discriminator _type_ can either be "Image" or "Video".
This is the way swagger intended polymorphism.
```yaml
Medium:
  required:
    - type
  properties:
    type:
      type: string
Image:
    required:
      - source
    allOf:
      - $ref: '#/definitions/Medium'
    properties:
      source:
        type: string
Video:
    required:
      - length
    allOf:
      - $ref: '#/definitions/Medium'
    properties:
      length:
        type: integer
```

```TypeScript
let medium = {
  type: 'Image',
  source: 'source' // property only exists within image
};

// the plot in polymorphism is that you validate
// your model against the abstract Medium class,
// not against the concrete Image class
validator.validateModel(medium, 'Medium', (err, result) => {
  //...
});
```

## Enum polymorphism
Instead of using the Name of the object, enum polymorphism uses enums to differentiate:

```yaml
Section:
  required:
    - sectionType
  discriminator: sectionType
  properties:
    sectionType:
      type: string
      enum:
        - TEXT_SECTION
        - IMAGE_SECTION

TextSection:
  allOf:
    - $ref: '#/definitions/Section'
  properties:
    sectionType:
      type: string
      enum:
        - TEXT_SECTION
    textContent:
      type: string

ImageSection:
  required:
    - imageSource
  allOf:
    - $ref: '#/definitions/Section'
  properties:
    sectionType:
      type: string
      enum:
        - IMAGE_SECTION
    imageSource:
      type: string
```
```TypeScript
let section = {
  sectionType: 'TEXT_SECTION',
  textContent: 'Custom polymorphed text section'
};
```

## Polymorphism within the stack trace
The stack trace will tell you if polymorphism was detected.
So if a Medium may be an Image, and Polymorphism was detected, a trace may look like this:

```json
{
    "errors": [
        {
            "errorType": "MISSING_REQUIRED_PROPERTY",
            "trace": [
                {
                    "stepName": "Medium",
                    "concreteModel": "Image" // here
                },
                {
                    "stepName": "source"
                }
            ]
        }
    ]
}
```

HumanReadable:
```
Missing required property:
	 - At Medium<Image>/source
```

# Potentially breaking Changes
## 1.3.0
- Fixed typo, changed `ValidationErrorType` from 'CONSTRAINTS_VIOATION' to 'CONSTRAINTS_VIOLATION' (added missing L)
- If you call `validateModel()` without a full-fledged spec (i.e. just the model definition), the first error step did previously not have a name. This was changed to the dedicated name 'root'.

## 1.4.0
- The `ValidationErrorType` in `result.model` was changed from a numeric enum to a more verbose string enum. This will mainly affect JavaScript applications and their logic to handle specific validation errors. TypeScript applications should be unaffected if the enums were used as documented. The values changed from integers between 0 and 6 to 'MISSING_REQUIRED_PROPERTY', 'ADDITIONAL_PROPERTY', 'TYPE_MISMATCH', 'ENUM_MISMATCH', 'DATE_FORMAT', 'CONSTRAINTS_VIOLATION', and 'CUSTOM'.
- Added support for `uniqueItems`. Please also read about the default cap of 100 items [here](#Limiting-the-Unique-Items-Constraint).

# Development
Wanna help? Sure. Please make sure to use an IDE with TSLint and EditorConfig installed. Always work test-driven, for each feature or bug you fix there needs to be a test.

```bash
npm run-script watch:test # Build the application, run tests and watch the FS
npm run-script debug # Very useful to trace bugs. You need a remote debugging software, I use VSCode debugger
```
