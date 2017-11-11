'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.ifNodeMatches = ifNodeMatches;
exports.doesNodeMatchShape = doesNodeMatchShape;
exports.asNamedJsValues = asNamedJsValues;

var _graphql = require('graphql');

function ifNodeMatches(shape, action) {
    return function (node) {
        if (doesNodeMatchShape(node, shape)) {
            action(node);
        }
    };
}

function doesNodeMatchShape(node, shape) {
    return node && shape && Object.keys(shape).every(nodePropertyMatchesShape);

    function nodePropertyMatchesShape(shapeKey) {
        var shapeValueOrFunction = shape[shapeKey];
        var nodePropertyValue = node[shapeKey];

        return typeof shapeValueOrFunction === 'function' ? shapeValueOrFunction(nodePropertyValue) : isPrimitive(shapeValueOrFunction) ? shapeValueOrFunction === nodePropertyValue : doesNodeMatchShape(nodePropertyValue, shapeValueOrFunction);
    }
}

function asNamedJsValues(directiveArguments) {
    return directiveArguments.reduce(toJsValuesMap, {});

    function toJsValuesMap(jsValuesMap, _ref) {
        var name = _ref.name,
            value = _ref.value;

        jsValuesMap[name.value] = asJsValue(value);

        return jsValuesMap;
    }
}

function asJsValue(astValue) {
    switch (astValue.kind) {
        case 'IntValue':
            return _graphql.GraphQLInt.parseLiteral(astValue);
        case 'FloatValue':
            return _graphql.GraphQLFloat.parseLiteral(astValue);
        case 'BooleanValue':
            return _graphql.GraphQLBoolean.parseLiteral(astValue);
        case 'StringValue':
            return _graphql.GraphQLString.parseLiteral(astValue);
        default:
            throw new Error('Conversion of value: \'' + kind + '\' not supported.');
    }
}

function isPrimitive(value) {
    return value == null || /^[sbn]/.test(typeof value === 'undefined' ? 'undefined' : _typeof(value));
}