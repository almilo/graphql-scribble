'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = createSchemaAnnotationExtractor;

var _graphql = require('graphql');

var _isMyJsonValid = require('is-my-json-valid');

var _isMyJsonValid2 = _interopRequireDefault(_isMyJsonValid);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SchemaAnnotationExtractor = function () {
    function SchemaAnnotationExtractor(annotationDescriptors) {
        _classCallCheck(this, SchemaAnnotationExtractor);

        this.annotationVisitor = createAnnotationVisitor(annotationDescriptors);
    }

    _createClass(SchemaAnnotationExtractor, [{
        key: 'extract',
        value: function extract(schema) {
            var schemaAst = (0, _graphql.parse)(schema);

            return this.annotationVisitor.visit(schemaAst);
        }
    }]);

    return SchemaAnnotationExtractor;
}();

function createSchemaAnnotationExtractor(annotationDescriptors) {
    return new SchemaAnnotationExtractor(annotationDescriptors);
}

function createAnnotationVisitor(annotationDescriptors) {
    return {
        visit: function visit(schemaAst) {
            var allAnnotationsData = {};
            var visitor = createVisitor(annotationDescriptors, allAnnotationsData);

            (0, _graphql.visit)(schemaAst, visitor);

            return allAnnotationsData;
        }
    };

    function createVisitor(annotationDescriptors, allAnnotationsData) {
        var annotationNames = Object.keys(annotationDescriptors);
        var annotationValidators = Object.entries(annotationDescriptors).reduce(toAnnotationValidators, {});
        var knownAnnotation = createKnownAnnotationMatcher(annotationNames);

        return {
            enter: (0, _utils.ifNodeMatches)(knownAnnotation, function (node) {
                var argumentsAst = node.arguments,
                    annotationName = node.name.value;

                var annotationArguments = (0, _utils.asNamedJsValues)(argumentsAst);
                var validator = annotationValidators[annotationName];

                validate(validator, annotationName, annotationArguments);

                (0, _utils.upsert)(allAnnotationsData, annotationName, annotationArguments);
            })
        };

        function createKnownAnnotationMatcher(annotationNames) {
            return {
                kind: 'Directive',
                name: function name(_ref) {
                    var annotationName = _ref.value;
                    return annotationNames.includes(annotationName);
                }
            };
        }

        function toAnnotationValidators(annotationValidators, _ref2) {
            var _ref3 = _slicedToArray(_ref2, 2),
                annotationName = _ref3[0],
                schema = _ref3[1].schema;

            var noop = function noop() {
                return true;
            };

            annotationValidators[annotationName] = schema ? (0, _isMyJsonValid2.default)({
                required: true,
                type: 'object',
                properties: schema
            }) : noop;

            return annotationValidators;
        }

        function validate(validator, annotationName, annotationData) {
            var isValid = validator(annotationData);

            if (!isValid) {
                var data = JSON.stringify(annotationData);
                var userFriendlyErrors = validator.errors.map(toUserFriendlyError).join(', ');
                var errors = JSON.stringify(userFriendlyErrors);

                throw new Error('Error validating annotation \'' + annotationName + '\', data: \'' + data + '\', errors: \'' + errors + '\'.');
            }

            function toUserFriendlyError(_ref4) {
                var field = _ref4.field,
                    message = _ref4.message;

                return field + ': ' + message;
            }
        }
    }
}