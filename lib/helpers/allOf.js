"use strict";
var Promise = require("bluebird");
var loader_1 = require("../helpers/loader");
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
exports.extendAllAllOfs = extendAllAllOfs;
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
            if (!to.properties) {
                to.properties = {};
            }
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
