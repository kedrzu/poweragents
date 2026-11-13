/** The `nerdctl run` arguments of the agent's container, and the spec they carry. */
export interface AgentRunArgs {
    args: string[];
    /**
     * A hash of everything else in `args`, set as the container's `poweragents.spec` label: a running container with
     * the same spec runs the same image with the same options, so it can be reused instead of recreated.
     */
    spec: string;
}

/** The container label holding `AgentRunArgs.spec`. */
export const AGENT_SPEC_LABEL = 'poweragents.spec';
/** The agent's container. */
export const AGENT_CONTAINER = 'poweragents-agent';
/** The profile's data root in the VM, mounted at the same path in the container and its working directory. */
export const AGENT_DATA_ROOT = '/Poweragents';
/** The port the agent is published on, on the VM's loopback (Lima forwards it to the host's), next to the daemon's. */
export const AGENT_HOST_PORT = 47611;

/** The port OpenCode listens on inside the container. */
const OPENCODE_PORT = 4096;

/**
 * Builds the `nerdctl` arguments that start the agent's container: OpenCode serving on the loopback only, behind the
 * password nerdctl reads from its stdin (`OPENCODE_SERVER_PASSWORD=…`), with the profile's data root and two named volumes keeping Claude's login and OpenCode's
 * conversations across container recreation. The password never appears in the arguments, which other processes can
 * read.
 * @__NO_SIDE_EFFECTS__
 */
export function buildAgentRunArgs(image: string): AgentRunArgs {
    const options = [
        '--detach',
        '--name',
        AGENT_CONTAINER,
        '--publish',
        `127.0.0.1:${AGENT_HOST_PORT}:${OPENCODE_PORT}`,
        '--volume',
        `${AGENT_DATA_ROOT}:${AGENT_DATA_ROOT}`,
        '--volume',
        'poweragents-claude:/root/.claude',
        '--volume',
        'poweragents-opencode:/root/.local/share/opencode',
        '--env',
        'CLAUDE_CONFIG_DIR=/root/.claude',
        '--env-file',
        '/dev/stdin',
        '--workdir',
        AGENT_DATA_ROOT,
        image,
        'opencode',
        'serve',
        '--hostname',
        '0.0.0.0',
        '--port',
        String(OPENCODE_PORT),
    ];
    const spec = new Bun.CryptoHasher('sha256').update(options.join('\0')).digest('hex').slice(0, 16);

    return { args: ['run', '--label', `${AGENT_SPEC_LABEL}=${spec}`, ...options], spec };
}
