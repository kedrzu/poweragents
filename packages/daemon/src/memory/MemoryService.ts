import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { defineService } from '@nzyme/ioc/Service.js';
import { Logger } from '@nzyme/logging/Logger.js';

import { MEMORY_FOLDER, POWERAGENTS_DATA_ROOT } from '../env.js';

/** The person's Memory (design D9): Markdown files in the data root's `MEMORY_FOLDER`, written by the agent. */
export interface MemoryServiceShape {
    /** Creates the Memory folder when it is missing; the daemon calls it at start. */
    ensureFolder(): Promise<void>;
}

/** The person's Memory folder. */
export const MemoryService = defineService({
    name: 'MemoryService',
    deps: { logger: Logger, dataRoot: POWERAGENTS_DATA_ROOT },
    setup({ logger, dataRoot }): MemoryServiceShape {
        const root = path.resolve(dataRoot, MEMORY_FOLDER);

        return { ensureFolder };

        async function ensureFolder() {
            const created = await mkdir(root, { recursive: true });
            if (created !== undefined) {
                logger.info('Memory folder created');
            }
        }
    },
});
