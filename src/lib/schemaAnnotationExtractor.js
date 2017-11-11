import { parse, visit } from 'graphql';
import validator from 'is-my-json-valid';
import { asNamedJsValues, ifNodeMatches, upsert } from './utils';

class SchemaAnnotationExtractor {
    constructor(annotationDescriptors) {
        this.annotationVisitor = createAnnotationVisitor(annotationDescriptors);
    }

    extract(schema) {
        const schemaAst = parse(schema);

        return this.annotationVisitor.visit(schemaAst);
    }
}

export default function createSchemaAnnotationExtractor(annotationDescriptors) {
    return new SchemaAnnotationExtractor(annotationDescriptors);
}

function createAnnotationVisitor(annotationDescriptors) {
    return {
        visit(schemaAst) {
            const allAnnotationsData = {};
            const visitor = createVisitor(annotationDescriptors, allAnnotationsData);

            visit(schemaAst, visitor);

            return allAnnotationsData;
        }
    };

    function createVisitor(annotationDescriptors, allAnnotationsData) {
        const annotationNames = Object.keys(annotationDescriptors);
        const annotationValidators = Object.entries(annotationDescriptors)
            .reduce(toAnnotationValidators, {});
        const knownAnnotation = createKnownAnnotationMatcher(annotationNames);

        return {
            enter: ifNodeMatches(
                knownAnnotation,
                node => {
                    const {arguments: argumentsAst, name: {value: annotationName}} = node;
                    const annotationArguments = asNamedJsValues(argumentsAst);
                    const validator = annotationValidators[annotationName];

                    validate(validator, annotationName, annotationArguments);

                    const annotationData = {
                        node,
                        arguments: annotationArguments
                    };

                    upsert(allAnnotationsData, annotationName, annotationData);
                }
            )
        };

        function createKnownAnnotationMatcher(annotationNames) {
            return {
                kind: 'Directive',
                name: ({value: annotationName}) => annotationNames.includes(annotationName)
            };
        }

        function toAnnotationValidators(annotationValidators, [annotationName, {schema}]) {
            const noop = () => true;

            annotationValidators[annotationName] = schema
                ? validator({
                    required: true,
                    type: 'object',
                    properties: schema
                })
                : noop;

            return annotationValidators;
        }

        function validate(validator, annotationName, annotationData) {
            const isValid = validator(annotationData);

            if (!isValid) {
                const data = JSON.stringify(annotationData);
                const userFriendlyErrors = validator.errors
                    .map(toUserFriendlyError)
                    .join(', ');
                const errors = JSON.stringify(userFriendlyErrors);

                throw new Error(`Error validating annotation '${annotationName}', data: '${data}', errors: '${errors}'.`);
            }

            function toUserFriendlyError({field, message}) {
                return `${field}: ${message}`;
            }
        }
    }
}
