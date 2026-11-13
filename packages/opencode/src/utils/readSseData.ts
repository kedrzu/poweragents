/**
 * Reads a server-sent events stream and yields the `data` of each event (multi-line data joined with `\n`). Comments
 * (heartbeats) and events without data are skipped. Stopping the iteration (`break`, `return`) cancels the stream.
 * @util
 */
export async function* readSseData(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let data: string[] = [];

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                return;
            }

            buffer += decoder.decode(value, { stream: true });
            let newline = buffer.indexOf('\n');
            while (newline !== -1) {
                const line = buffer.slice(0, newline).replace(/\r$/, '');
                buffer = buffer.slice(newline + 1);
                newline = buffer.indexOf('\n');

                if (line === '') {
                    if (data.length > 0) {
                        yield data.join('\n');
                        data = [];
                    }
                } else if (line.startsWith('data:')) {
                    data.push(line.slice(5).replace(/^ /, ''));
                }
            }
        }
    } finally {
        await reader.cancel().catch(() => undefined);
    }
}
