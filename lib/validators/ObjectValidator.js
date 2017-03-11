"use strict";
const ModelValidator_1 = require("./ModelValidator");
const result_1 = require("../result");
const pushError_1 = require("../helpers/pushError");
const loader_1 = require("../helpers/loader");
function validateObject(test, schema, spec, config, trace) {
    if (schema === undefined || spec === undefined) {
        throw new Error('Schema or spec is not defined');
    }
    if (!test || !(test instanceof Object)) {
        let typeIs = typeof (test);
        if (Array.isArray(test)) {
            typeIs = 'array';
        }
        let typeShouldBe = schema.title ? schema.title : 'object';
        return Promise.resolve([
            {
                trace: trace,
                errorType: result_1.ValidationErrorType.TYPE_MISMATCH,
                typeIs: typeIs,
                typeShouldBe: typeShouldBe,
            }
        ]);
    }
    let childValidation = [];
    let errors = [];
    let concreteClass = schema.discriminator ? findConcreteObject(schema, trace, test, config, spec) : extendAllAllOfs(schema, config, spec);
    return concreteClass
        .then(schema => {
        if (schema.required) {
            schema.required.forEach((propertyName) => {
                if (test[propertyName] === undefined) {
                    let newTrace = JSON.parse(JSON.stringify(trace));
                    newTrace.push({
                        stepName: propertyName
                    });
                    pushError_1.pushError({
                        errorType: result_1.ValidationErrorType.MISSING_REQUIRED_PROPERTY,
                        trace: newTrace
                    }, errors, test, schema, spec, config);
                }
            });
        }
        for (let propertyName in test) {
            if (test.hasOwnProperty(propertyName)) {
                let currentPropertyTest = test[propertyName];
                let currentPropertySchema;
                if (schema.properties && schema.properties[propertyName]) {
                    currentPropertySchema = schema.properties[propertyName];
                }
                else if (schema.additionalProperties) {
                    let properties = schema.additionalProperties;
                    currentPropertySchema = properties[propertyName];
                }
                let newTrace = JSON.parse(JSON.stringify(trace));
                newTrace.push({
                    stepName: propertyName
                });
                if (!currentPropertySchema) {
                    if (config.allowAdditionalProperties === true) {
                    }
                    else if (!schema.additionalProperties) {
                        pushError_1.pushError({
                            errorType: result_1.ValidationErrorType.ADDITIONAL_PROPERTY,
                            trace: newTrace
                        }, errors, test, schema, spec, config);
                    }
                    else {
                        childValidation.push(ModelValidator_1.validateModel(currentPropertyTest, schema.additionalProperties, spec, config, newTrace));
                    }
                }
                else {
                    childValidation.push(ModelValidator_1.validateModel(currentPropertyTest, currentPropertySchema, spec, config, newTrace));
                }
            }
        }
        if (childValidation) {
            return Promise.all(childValidation).then(childErrors => childErrors.reduce((a, b) => {
                return a.concat(b);
            }, errors));
        }
        return Promise.resolve(errors);
    });
}
exports.validateObject = validateObject;
function extendAllAllOfs(schema, config, spec) {
    if (!schema.allOf || !schema.allOf.length) {
        return Promise.resolve(schema);
    }
    let parentPromises = [];
    schema.allOf.forEach((parentObject) => {
        let parentPromise;
        if (parentObject.$ref) {
            parentPromise = loader_1.loadSchema(parentObject, spec, config);
        }
        else {
            parentPromise = Promise.resolve(parentObject);
        }
        parentPromise
            .then(parentObject => extendAllAllOfs(parentObject, config, spec))
            .then(parentObject => {
            return extend(parentObject, schema);
        });
        parentPromises.push(parentPromise);
    });
    return Promise.all(parentPromises)
        .then(parents => {
        let result = parents.reduce((a, b) => {
            return extend(b, a);
        }, schema);
        return result;
    });
}
function extend(from, to) {
    if (from.required) {
        if (to.required) {
            to.required = to.required.concat(from.required.filter(item => {
                return to.required.indexOf(item) === -1;
            }));
        }
        else {
            to.required = from.required;
        }
    }
    for (let propertyName in from.properties) {
        if (from.properties.hasOwnProperty(propertyName)) {
            let property = from.properties[propertyName];
            if (!to.properties[propertyName]) {
                to.properties[propertyName] = property;
            }
        }
    }
    if (!to._allOf) {
        to._allOf = to.allOf;
        to.allOf = [];
    }
    return to;
}
function isDerived(possibleChild, parent, config, spec) {
    let allOf = possibleChild._allOf;
    if (!allOf) {
        return Promise.resolve(false);
    }
    return Promise.all(allOf.map((childParent) => {
        return loader_1.loadSchema(childParent, spec, config)
            .then(childParent => parent === childParent);
    })).then(isOneDerived => isOneDerived.filter(derived => derived).length !== 0);
}
function findConcreteObject(abstractClass, trace, test, config, spec) {
    let derivedObjects = [];
    let stopLoop = false;
    for (let possibleDerivedClassName in spec.definitions) {
        if (spec.definitions.hasOwnProperty(possibleDerivedClassName)) {
            if (stopLoop) {
                break;
            }
            derivedObjects.push(loader_1.loadSchemaByName(possibleDerivedClassName, spec, config)
                .then(schema => extendAllAllOfs(schema, config, spec))
                .then(possibleDerivedClass => {
                return isDerived(possibleDerivedClass, abstractClass, config, spec)
                    .then(derived => {
                    if (derived) {
                        stopLoop = true;
                        return {
                            schema: possibleDerivedClass,
                            schemaName: possibleDerivedClassName
                        };
                    }
                    return undefined;
                });
            }));
        }
    }
    return Promise.all(derivedObjects)
        .then(derivedObjects => derivedObjects.filter(derivedObject => derivedObject !== undefined))
        .then(derivedObjects => {
        if (derivedObjects.length === 0) {
            return Promise.reject(`Confusing discriminator - Schema uses discriminator but there are no other Schemas extending it via allOf. Trace: ${result_1.getTraceString(trace)}`);
        }
        return derivedObjects.filter(derivedObject => {
            let validPolymorhpism = test[abstractClass.discriminator] === derivedObject.schemaName;
            if (!validPolymorhpism && abstractClass.properties[abstractClass.discriminator].enum && abstractClass.properties[abstractClass.discriminator].enum.indexOf(test[abstractClass.discriminator]) !== -1) {
                if (derivedObject.schema.properties[abstractClass.discriminator].enum
                    && derivedObject.schema.properties[abstractClass.discriminator].enum.length === 1
                    && derivedObject.schema.properties[abstractClass.discriminator].enum[0] === test[abstractClass.discriminator]) {
                    validPolymorhpism = true;
                }
            }
            if (validPolymorhpism) {
                trace[trace.length - 1].concreteModel = derivedObject.schemaName;
            }
            return validPolymorhpism;
        });
    })
        .then(derivedObjects => {
        if (derivedObjects.length === 0) {
            return Promise.reject(`Polymorphism Error: No concrete object found. Trace: ${result_1.getTraceString(trace)}`);
        }
        if (derivedObjects.length > 1) {
            return Promise.reject(`Polymorphism Error: More than one concrete object found. Trace: ${result_1.getTraceString(trace)}`);
        }
        return Promise.resolve(derivedObjects[0].schema);
    });
}
