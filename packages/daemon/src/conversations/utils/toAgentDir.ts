import path from 'node:path';

import { AGENT_PROJECTS_DIR } from '../../sandbox/buildAgentRunArgs.js';

/**
 * A project folder as the agent's container sees it: every project folder sits directly inside the projects' folder,
 * which the agent sees as `AGENT_PROJECTS_DIR`.
 * @util
 * @__NO_SIDE_EFFECTS__
 */
export function toAgentDir(projectDir: string) {
    return path.posix.join(AGENT_PROJECTS_DIR, path.basename(projectDir));
}
