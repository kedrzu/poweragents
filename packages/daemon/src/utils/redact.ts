/**
 * Removes every secret from text that is about to be logged.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function redact(text: string, secrets: string[]) {
    let redacted = text;
    for (const secret of secrets) {
        redacted = redacted.replaceAll(secret, '[redacted]');
    }
    return redacted;
}
