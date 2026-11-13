/**
 * A string property of a value parsed from JSON, or `undefined` when it is missing or not a string.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function readString(value: object, key: string): string | undefined {
    const property: unknown = Reflect.get(value, key);
    return typeof property === 'string' ? property : undefined;
}
