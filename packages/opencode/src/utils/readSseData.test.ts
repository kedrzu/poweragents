import { expect, test } from 'bun:test';

import { readSseData } from './readSseData.js';

test('yields event data across chunk boundaries, skipping comments and joining multi-line data', async () => {
    const stream = streamOf([
        'data: {"a":',
        '1}\r\n\r\n: heartbeat\n\nevent: x\nda',
        'ta: line one\ndata: line two\n\ndata: trailing-without-blank-line',
    ]);

    const events: string[] = [];
    for await (const data of readSseData(stream)) {
        events.push(data);
    }

    expect(events).toEqual(['{"a":1}', 'line one\nline two']);
});

test('cancels the stream when the consumer stops early', async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
        start(controller) {
            controller.enqueue(new TextEncoder().encode('data: first\n\n'));
        },
        cancel() {
            cancelled = true;
        },
    });

    for await (const data of readSseData(stream)) {
        expect(data).toBe('first');
        break;
    }

    expect(cancelled).toBe(true);
});

function streamOf(chunks: string[]) {
    return new ReadableStream<Uint8Array>({
        start(controller) {
            for (const chunk of chunks) {
                controller.enqueue(new TextEncoder().encode(chunk));
            }
            controller.close();
        },
    });
}
