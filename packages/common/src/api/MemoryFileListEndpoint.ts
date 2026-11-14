import { defineEndpoint } from '@nzyme/rpc/defineEndpoint.js';

import type { MemoryFile } from './MemoryTypes.js';

/** The Markdown files of the person's Memory, sorted by path. */
export const MemoryFileListEndpoint = defineEndpoint<void, MemoryFile[]>({ name: 'memory/files' });
