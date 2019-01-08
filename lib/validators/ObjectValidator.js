"use strict";
var Promise = require("bluebird");
var ModelValidator_1 = require("./ModelValidator");
var result_1 = require("../result");
var pushError_1 = require("../helpers/pushError");
var loader_1 = require("../helpers/loader");
function validateObject(test, schema, spec, config, trace) {
    if (schema === undefined || spec === undefined) {
        throw new Error('Schema or spec is not defined');
    }
    if (config.allowXNullable === true && test === null && schema['x-nullable'] === true) {
        return Promise.resolve([]);
    }
    if (!test || !(test instanceof Object)) {
        var typeIs = typeof (test);
        if (Array.isArray(test)) {
            typeIs = 'array';
        }
        if (test === null) {
            typeIs = 'null';
        }
        var typeShouldBe = schema.title ? schema.title : 'object';
        return Promise.resolve([
            {
                trace: trace,
                errorType: result_1.ValidationErrorType.TYPE_MISMATCH,
                typeIs: typeIs,
                typeShouldBe: typeShouldBe,
            }
        ]);
    }
    var childValidation = [];
    var errors = [];
    var concreteClass = schema.discriminator ? findConcreteObject(schema, trace, test, config, spec) : extendAllAllOfs(schema, config, spec);
    return concreteClass
        .then(function (schema) {
        if (schema.required) {
            schema.required.forEach(function (propertyName) {
                if (test[propertyName] === undefined) {
                    var newTrace = JSON.parse(JSON.stringify(trace));
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
        for (var propertyName in test) {
            if (test.hasOwnProperty(propertyName)) {
                var currentPropertyTest = test[propertyName];
                var currentPropertySchema = void 0;
                if (schema.properties && schema.properties[propertyName]) {
                    currentPropertySchema = schema.properties[propertyName];
                }
                else if (schema.additionalProperties) {
                    var properties = schema.additionalProperties;
                    currentPropertySchema = properties[propertyName];
                }
                var newTrace = JSON.parse(JSON.stringify(trace));
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
            return Promise.all(childValidation).then(function (childErrors) { return childErrors.reduce(function (a, b) {
                return a.concat(b);
            }, errors); });
        }
        return Promise.resolve(errors);
    });
}
exports.validateObject = validateObject;
function extendAllAllOfs(schema, config, spec) {
    if (!schema.allOf || !schema.allOf.length) {
        return Promise.resolve(schema);
    }
    var parentPromises = [];
    schema.allOf.forEach(function (parentObject) {
        var parentPromise;
        if (parentObject.$ref) {
            parentPromise = loader_1.loadSchema(parentObject, spec, config);
        }
        else {
            parentPromise = Promise.resolve(parentObject);
        }
        parentPromise
            .then(function (parentObject) { return extendAllAllOfs(parentObject, config, spec); })
            .then(function (parentObject) {
            return extend(parentObject, schema);
        });
        parentPromises.push(parentPromise);
    });
    return Promise.all(parentPromises)
        .then(function (parents) {
        var result = parents.reduce(function (a, b) {
            return extend(b, a);
        }, schema);
        return result;
    });
}
function extend(from, to) {
    if (from.required) {
        if (to.required) {
            to.required = to.required.concat(from.required.filter(function (item) {
                return to.required.indexOf(item) === -1;
            }));
        }
        else {
            to.required = from.required;
        }
    }
    for (var propertyName in from.properties) {
        if (from.properties.hasOwnProperty(propertyName)) {
            var property = from.properties[propertyName];
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
    var allOf = possibleChild._allOf;
    if (!allOf) {
        return Promise.resolve(false);
    }
    return Promise.all(allOf.map(function (childParent) {
        return loader_1.loadSchema(childParent, spec, config)
            .then(function (childParent) { return parent === childParent; });
    })).then(function (isOneDerived) { return isOneDerived.filter(function (derived) { return derived; }).length !== 0; });
}
function findConcreteObject(abstractClass, trace, test, config, spec) {
    var derivedObjects = [];
    var stopLoop = false;
    var _loop_1 = function (possibleDerivedClassName) {
        if (spec.definitions.hasOwnProperty(possibleDerivedClassName)) {
            if (stopLoop) {
                return "break";
            }
            derivedObjects.push(loader_1.loadSchemaByName(possibleDerivedClassName, spec, config)
                .then(function (schema) { return extendAllAllOfs(schema, config, spec); })
                .then(function (possibleDerivedClass) {
                return isDerived(possibleDerivedClass, abstractClass, config, spec)
                    .then(function (derived) {
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
    };
    for (var possibleDerivedClassName in spec.definitions) {
        var state_1 = _loop_1(possibleDerivedClassName);
        if (state_1 === "break")
            break;
    }
    return Promise.all(derivedObjects)
        .then(function (derivedObjects) { return derivedObjects.filter(function (derivedObject) { return derivedObject !== undefined; }); })
        .then(function (derivedObjects) {
        if (derivedObjects.length === 0) {
            return Promise.reject("Confusing discriminator - Schema uses discriminator but there are no other Schemas extending it via allOf. Trace: " + result_1.getTraceString(trace));
        }
        return derivedObjects.filter(function (derivedObject) {
            var validPolymorhpism = test[abstractClass.discriminator] === derivedObject.schemaName;
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
        .then(function (derivedObjects) {
        if (derivedObjects.length === 0) {
            return Promise.reject("Polymorphism Error: No concrete object found. Trace: " + result_1.getTraceString(trace));
        }
        if (derivedObjects.length > 1) {
            return Promise.reject("Polymorphism Error: More than one concrete object found. Trace: " + result_1.getTraceString(trace));
        }
        return Promise.resolve(derivedObjects[0].schema);
    });
}
