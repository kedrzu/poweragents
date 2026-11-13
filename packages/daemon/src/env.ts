import os from 'node:os';
import path from 'node:path';

import { defineEnvVariable } from '@nzyme/ioc/defineEnvVariable.js';

/**
 * The unpacked Lima release the sandbox runs (`bin/limactl` inside). The desktop app passes the copy bundled in its
 * resources; the default, resolved against the daemon's source, is the copy `scripts/fetchLima.ts` downloads for
 * development and does not exist inside a compiled daemon.
 */
export const POWERAGENTS_LIMA_DIR = defineEnvVariable('POWERAGENTS_LIMA_DIR', {
    default: () => path.resolve(import.meta.dirname, '../vendor/lima'),
});

/**
 * The profile's data root: every project's folder, and the only folder of the computer the sandbox mounts. Set in tests
 * and development to keep a real profile untouched.
 */
export const POWERAGENTS_DATA_ROOT = defineEnvVariable('POWERAGENTS_DATA_ROOT', {
    default: () => path.join(os.homedir(), 'Poweragents'),
});

/**
 * Lima's home (`LIMA_HOME`): the sandbox's VM, its disk and volumes. The daemon keeps its own state (the agent's
 * password) and its log (`logs/daemon.log`) in the folder above it, so a test pointing this at a scratch folder leaves
 * the real VM, its state and its log untouched. Keep the path short: Lima's unix sockets live under it, and macOS caps a
 * socket path at 104 bytes.
 */
export const POWERAGENTS_LIMA_HOME = defineEnvVariable('POWERAGENTS_LIMA_HOME', {
    default: () => path.join(os.homedir(), '.poweragents', 'lima'),
});
