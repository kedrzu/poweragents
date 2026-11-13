import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * An endpoint's input schema from a parser of its body: `parse` returns the input, or `undefined` when the body does
 * not fit, which the daemon refuses with `expected` as the issue.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function createInputSchema<T>(
    expected: string,
    parse: (value: object) => T | undefined,
): StandardSchemaV1<unknown, T> {
    return {
        '~standard': {
            version: 1,
            vendor: 'poweragents',
            validate(value) {
                const input = typeof value === 'object' && value !== null ? parse(value) : undefined;
                return input === undefined ? { issues: [{ message: `Expected ${expected}` }] } : { value: input };
            },
        },
    };
}
