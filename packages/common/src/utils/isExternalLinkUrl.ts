/**
 * Whether a link may be opened outside the app, in the person's browser or mail program: an `https:` or `mailto:` address.
 * Anything else (plain `http:`, `javascript:`, `data:`, `file:`, a relative path) is not.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function isExternalLinkUrl(url: string): boolean {
    let protocol: string;
    try {
        protocol = new URL(url).protocol;
    } catch {
        return false;
    }
    switch (protocol) {
        case 'https:':
        case 'mailto:':
            return true;
        default:
            return false;
    }
}
