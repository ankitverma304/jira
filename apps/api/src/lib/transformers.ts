export function toDelimitedString(values: string[] | undefined) {
  return (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .join(",");
}

export function fromDelimitedString(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeMetadata(input: unknown) {
  if (input === undefined) {
    return undefined;
  }

  return JSON.stringify(input);
}
