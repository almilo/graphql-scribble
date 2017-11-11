export function upsert(map, key, value) {
    let values = map[key];

    if (!values) {
        values = map[key] = [];
    }

    values.push(value);
}
