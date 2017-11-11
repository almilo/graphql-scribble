import { GraphQLBoolean, GraphQLFloat, GraphQLInt, GraphQLString } from 'graphql';

export function ifNodeMatches(shape, action) {
    return node => {
        if (doesNodeMatchShape(node, shape)) {
            action(node);
        }
    };
}

export function doesNodeMatchShape(node, shape) {
    return node && shape && Object.keys(shape).every(nodePropertyMatchesShape);

    function nodePropertyMatchesShape(shapeKey) {
        const shapeValueOrFunction = shape[shapeKey];
        const nodePropertyValue = node[shapeKey];

        return typeof shapeValueOrFunction === 'function'
            ? shapeValueOrFunction(nodePropertyValue)
            : isPrimitive(shapeValueOrFunction)
                ? shapeValueOrFunction === nodePropertyValue
                : doesNodeMatchShape(nodePropertyValue, shapeValueOrFunction);
    }
}

export function asNamedJsValues(directiveArguments) {
    return directiveArguments.reduce(toJsValuesMap, {});

    function toJsValuesMap(jsValuesMap, {name, value}) {
        jsValuesMap[name.value] = asJsValue(value);

        return jsValuesMap;
    }
}

function asJsValue(astValue) {
    switch (astValue.kind) {
        case 'IntValue':
            return GraphQLInt.parseLiteral(astValue);
        case 'FloatValue':
            return GraphQLFloat.parseLiteral(astValue);
        case 'BooleanValue':
            return GraphQLBoolean.parseLiteral(astValue);
        case 'StringValue':
            return GraphQLString.parseLiteral(astValue);
        default:
            throw new Error(`Conversion of value: '${kind}' not supported.`);
    }
}

function isPrimitive(value) {
    return value == null || /^[sbn]/.test(typeof value);
}
