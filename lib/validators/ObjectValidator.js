"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObject = void 0;
var Promise = require("bluebird");
var allOf_1 = require("../helpers/allOf");
var loader_1 = require("../helpers/loader");
var pushError_1 = require("../helpers/pushError");
var result_1 = require("../result");
var ModelValidator_1 = require("./ModelValidator");
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
    var poly = schema.discriminator && schema.properties[schema.discriminator];
    var concreteClass = poly ? findPolymorphicConcreteClass(schema, trace, test, config, spec) : (0, allOf_1.extendAllAllOfs)(schema, config, spec);
    return concreteClass
        .then(function (schema) {
        if (schema.required) {
            schema.required.forEach(function (propertyName) {
                if (test[propertyName] === undefined) {
                    var newTrace = JSON.parse(JSON.stringify(trace));
                    newTrace.push({
                        stepName: propertyName
                    });
                    (0, pushError_1.pushError)({
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
                        (0, pushError_1.pushError)({
                            errorType: result_1.ValidationErrorType.ADDITIONAL_PROPERTY,
                            trace: newTrace
                        }, errors, test, schema, spec, config);
                    }
                    else {
                        childValidation.push((0, ModelValidator_1.validateModel)(currentPropertyTest, schema.additionalProperties, spec, config, newTrace));
                    }
                }
                else {
                    childValidation.push((0, ModelValidator_1.validateModel)(currentPropertyTest, currentPropertySchema, spec, config, newTrace));
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
function isDerived(possibleChild, parent, config, spec) {
    var allOf = possibleChild._allOf;
    if (!allOf) {
        return Promise.resolve(false);
    }
    return Promise.all(allOf.map(function (childParent) {
        return (0, loader_1.loadSchema)(childParent, spec, config)
            .then(function (childParent) { return parent === childParent; });
    })).then(function (isOneDerived) { return isOneDerived.filter(function (derived) { return derived; }).length !== 0; });
}
function findDerivedObjects(abstractClass, config, spec) {
    var discriminatingFeature = abstractClass.discriminator;
    return Promise.resolve(Object.getOwnPropertyNames(spec.definitions))
        .map(function (name) {
        return {
            name: name,
            schema: spec.definitions[name]
        };
    })
        .map(function (namedSchema) {
        return (0, allOf_1.extendAllAllOfs)(namedSchema.schema, config, spec)
            .then(function (schema) {
            return {
                name: namedSchema.name,
                schema: schema
            };
        });
    })
        .filter(function (namedSchema) {
        var schema = namedSchema.schema;
        var name = namedSchema.name;
        if (!schema.allOf || !schema.properties[discriminatingFeature]) {
            return false;
        }
        var enumPoly = schema.properties[discriminatingFeature].enum;
        if (enumPoly) {
            return schema.properties[discriminatingFeature].enum.filter(function (e) { return abstractClass.properties[discriminatingFeature].enum.indexOf('' + e) !== -1; }).length > 0;
        }
        return true;
    })
        .filter(function (namedSchema) {
        return Promise.resolve(namedSchema.schema.allOf)
            .map(function (ref) { return (0, loader_1.loadSchema)(ref, spec, config); })
            .filter(function (parent) {
            return JSON.stringify(parent) === JSON.stringify(abstractClass);
        })
            .then(function (parents) { return parents.length > 0; });
    });
}
function findPolymorphicConcreteClass(abstractClass, trace, test, config, spec) {
    var derivedObjects = findDerivedObjects(abstractClass, config, spec);
    return derivedObjects
        .then(function (derivedObjects) {
        if (derivedObjects.length === 0) {
            return Promise.reject("Confusing discriminator - Schema uses discriminator but there are no other Schemas extending it via allOf and using this discriminator property. Trace: ".concat((0, result_1.getTraceString)(trace)));
        }
        return derivedObjects;
    })
        .filter(function (derivedObject) {
        if (derivedObject.schema.properties[abstractClass.discriminator].enum
            && derivedObject.schema.properties[abstractClass.discriminator].enum.length === 1
            && derivedObject.schema.properties[abstractClass.discriminator].enum[0] === test[abstractClass.discriminator]) {
            return true;
        }
        return test[abstractClass.discriminator] === derivedObject.name;
    })
        .then(function (derivedObjects) {
        if (derivedObjects.length === 0) {
            return Promise.reject("Polymorphism Error: No concrete object found. Trace: ".concat((0, result_1.getTraceString)(trace)));
        }
        if (derivedObjects.length > 1) {
            return Promise.reject("Polymorphism Error: More than one concrete object found. Trace: ".concat((0, result_1.getTraceString)(trace)));
        }
        var derivedObject = derivedObjects[0];
        trace[trace.length - 1].concreteModel = derivedObject.name;
        if (derivedObject.schema.discriminator) {
            trace.push({
                stepName: derivedObject.name
            });
            return findPolymorphicConcreteClass(derivedObject.schema, trace, test, config, spec);
        }
        return derivedObject.schema;
    });
}
