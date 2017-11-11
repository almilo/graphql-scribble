import { createSchemaAnnotationExtractor } from '..';

describe('lib tests', () => {
    const schemaAnnotationExtractor = createSchemaAnnotationExtractor({
        foo: {},
        bar: {}
    });
    const schema = `
        type User @foo(bar: "barValue", baz: "bazValue") {
            chirps: [Chirp]
        }
    `;

    it(`should extract all annotation data when the schema is annotated`, () => {
        const annotationData = schemaAnnotationExtractor.extract(schema);

        expect(annotationData).toEqual({
                foo: [
                    {
                        node: jasmine.any(Object),
                        arguments: {"bar": "barValue", "baz": "bazValue"}
                    }
                ]
            }
        );
    });
});
