"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.upsert = upsert;
function upsert(map, key, value) {
    var values = map[key];

    if (!values) {
        values = map[key] = [];
    }

    values.push(value);
}