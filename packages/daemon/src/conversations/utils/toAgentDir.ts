import path from 'node:path';

import { AGENT_DATA_ROOT } from '../../sandbox/buildAgentRunArgs.js';

/**
 * A project folder as the agent's container sees it: the data root is mounted at `AGENT_DATA_ROOT`, and every project
 * folder sits directly inside it.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function toAgentDir(projectDir: string) {
    return path.posix.join(AGENT_DATA_ROOT, path.basename(projectDir));
}
