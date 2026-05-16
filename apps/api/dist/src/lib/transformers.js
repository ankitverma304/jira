export function toDelimitedString(values) {
    return (values ?? [])
        .map((value) => value.trim())
        .filter(Boolean)
        .join(",");
}
export function fromDelimitedString(value) {
    if (!value) {
        return [];
    }
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}
export function serializeMetadata(input) {
    if (input === undefined) {
        return undefined;
    }
    return JSON.stringify(input);
}
