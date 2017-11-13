# graphql-scribble
Extract and validate annotation data (aka directives) from your GraphQL schemas in an easy and declarative way.

## Example

```js
import { createSchemaAnnotationExtractor } from 'graphql-scribble';

it(`should extract all annotation data when the schema is annotated`, () => {
    const schemaAnnotationExtractor = createSchemaAnnotationExtractor({
        foo: {
            schema: {
                bar: {
                    type: 'string',
                    required: true
                },
                baz: {
                    type: 'boolean'
                }
            }
        },
        bar: {
            schema: {
                value: {
                    type: 'number',
                    required: true
                }
            }
        }
    });
    const schema = `
        type User @foo(bar: "barValue", baz: false) {
            chirps: [Chirp] @bar(value: 42)
        }
    `;

    const annotationData = schemaAnnotationExtractor.extract(schema);

    expect(annotationData).toEqual({
            foo: [
                {
                    node: jasmine.any(Object),
                    arguments: {bar: "barValue", baz: false}
                }
            ],
            bar: [
                {
                    node: jasmine.any(Object),
                    arguments: {value: 42}
                }
            ]
        }
    );
});
```
