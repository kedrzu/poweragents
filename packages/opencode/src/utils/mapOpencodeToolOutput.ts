import type { OpencodeToolOutput } from '../OpencodeTypes.js';
import type { components } from '../schema.gen.js';

/**
 * What a tool call produced, as OpenCode reports it on a message or an event, in the daemon's terms. A kind of
 * output a later OpenCode adds is left out rather than failing the whole message or event.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function mapOpencodeToolOutput(
    content: components['schemas']['Tool.Content'][] | undefined,
): OpencodeToolOutput[] {
    const output: OpencodeToolOutput[] = [];
    for (const item of content ?? []) {
        switch (item.type) {
            case 'text':
                output.push({ type: 'text', text: item.text });
                break;
            case 'file':
                output.push({ type: 'file', uri: item.uri, mimeType: item.mime, name: item.name ?? undefined });
                break;
        }
    }
    return output;
}
