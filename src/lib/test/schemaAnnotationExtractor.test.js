import createSchemaAnnotationExtractor from '../schemaAnnotationExtractor';

describe('schema annotation extractor', () => {

    describe('extraction', () => {

        const schemaAnnotationExtractor = createSchemaAnnotationExtractor({
            foo: {},
            bar: {}
        });

        [
            [
                'extract no annotation data when the schema is not annotated',
                `
                type User {
                    chirps: [Chirp]
                }
                `,
                {}
            ],
            [
                'extract no annotation data when the annotations are not known',
                `
                type User @baz(foo: "fooValue", bar: "barValue") {
                    chirps: [Chirp]
                }
                `,
                {}
            ],
            [
                'extract all annotation data when the schema is annotated',
                `
                type User @foo(bar: "barValue", baz: "bazValue") {
                    chirps: [Chirp]
                }
                `,
                {
                    foo: [
                        {"bar": "barValue", "baz": "bazValue"}
                    ]
                }
            ],
            [
                'extract all annotation instances when annotation is used multiple times',
                `
                type User @foo(bar: "barValue") {
                    chirps: [Chirp] @foo(baz: "bazValue")
                }
                `,
                {
                    foo: [
                        {"bar": "barValue"},
                        {"baz": "bazValue"}
                    ]
                }
            ],
            [
                'extract all instances of all known annotations',
                `
                type User @foo(bar: "barValue") @bar(baz: "bazValue") @baz(foo: "fooValue") {
                    chirps: [Chirp] @foo(baz: "bazValue") @bar(bar: "barValue") @baz(foo: "fooValue")
                }
                `,
                {
                    foo: [
                        {"bar": "barValue"},
                        {"baz": "bazValue"}
                    ],
                    bar: [
                        {"baz": "bazValue"},
                        {"bar": "barValue"}
                    ]
                }
            ]
        ]
            .forEach(test);

        function test([description, schema, expectedValue, isSelected = false], _, allTests) {
            const someTestsAreSelected = allTests.find(([, , , isSelected]) => isSelected);

            if (!isSelected && someTestsAreSelected) {
                return;
            }

            it(`should ${description}`, () => {
                const annotationData = schemaAnnotationExtractor.extract(schema);

                expect(annotationData).toEqual(expectedValue);
            });
        }

    });

    describe('validation', () => {

        const schemaAnnotationExtractor = createSchemaAnnotationExtractor({
            foo: {
                schema: {
                    foo: {
                        type: 'string',
                        required: true
                    },
                    bar: {
                        type: 'number',
                        required: true
                    },
                    baz: {
                        type: 'boolean'
                    }
                }
            }
        });

        it('should thrown an error when the annotation data is not valid', () => {
            const schema = `
                type User @foo(foo: "fooValue", bar: "42") {
                    chirps: [Chirp]
                }
            `;

            expect(() => schemaAnnotationExtractor.extract(schema)).toThrowError('Error validating annotation \'foo\', data: \'{"foo":"fooValue","bar":"42"}\', errors: \'"data.bar: is the wrong type"\'.');
        });

        it('should thrown no errors when the annotation data is valid', () => {
            const schema = `
                type User @foo(foo: "fooValue", bar: 42) {
                    chirps: [Chirp]
                }
            `;

            expect(schemaAnnotationExtractor.extract(schema)).toEqual({foo: [{bar: 42, foo: 'fooValue'}]});
        });

    });

});
