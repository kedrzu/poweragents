import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { EnvVariables } from '@nzyme/ioc/helpers/EnvVariables.js';
import { defineService } from '@nzyme/ioc/Service.js';
import { ApplicationError } from '@nzyme/logging/ApplicationError.js';
import { Logger } from '@nzyme/logging/Logger.js';
import { createEventEmitter } from '@nzyme/utils/createEventEmitter.js';
import { createSingleRunner } from '@nzyme/utils/createSingleRunner.js';
import { createStopwatch } from '@nzyme/utils/createStopwatch.js';
import { waitUntil } from '@nzyme/utils/waitUntil.js';

import { POWERAGENTS_DATA_ROOT, POWERAGENTS_LIMA_DIR, POWERAGENTS_LIMA_HOME } from '../env.js';
import {
    AGENT_CONTAINER,
    AGENT_DATA_ROOT,
    AGENT_HOST_PORT,
    AGENT_SPEC_LABEL,
    buildAgentRunArgs,
} from './buildAgentRunArgs.js';
import { buildHostFirewall } from './buildHostFirewall.js';
import type { FirewallOpening } from './buildHostFirewall.js';
import { buildLimaConfig } from './buildLimaConfig.js';
import { readOrCreatePassword } from './readOrCreatePassword.js';
import AGENT_CONTAINERFILE from '../../sandbox/agent.Containerfile' with { type: 'text' };
import { Sandbox } from './Sandbox.js';
import type { SandboxEndpoint, SandboxExecParams, SandboxProcess, SandboxState } from './Sandbox.js';

const INSTANCE = 'poweragents-default';
/** The agent's images, tagged by `getImageTag()`. */
const IMAGE_REPOSITORY = 'poweragents-agent';
/**
 * The VM's memory. Lima's vz VM keeps every guest page it ever touched until it restarts, so this caps what the sandbox
 * can take from the computer, not what it takes on average. Lima reads it only when it creates the VM.
 */
const VM_MEMORY_GIB = 3;
/** The host as the VM sees it (`host.lima.internal`): Lima's user-mode network gateway, forwarding to the host. */
const HOST_GATEWAY = '192.168.5.2';
/**
 * The private addresses the sandbox may reach (design D8: the agent sees nothing else of the computer or its networks).
 * A port on the computer is `{ address: HOST_GATEWAY, port }`; a LAN device's is its address. None yet.
 */
const FIREWALL_OPENINGS: FirewallOpening[] = [];
/** The VM's boot-time nftables ruleset; it holds only the sandbox's rules, so it never flushes Lima's own. */
const FIREWALL_FILE = '/etc/nftables.conf';
const AGENT_READY_TIMEOUT_MS = 120_000;
/** How long a ready agent's last answer counts before `getVerifiedState()` asks it again. */
const AGENT_VERIFY_INTERVAL_MS = 5000;
const AGENT_VERIFY_ATTEMPTS = 3;
const AGENT_VERIFY_RETRY_MS = 500;
const BUILD_DIR = '/tmp/poweragents-agent-build';

interface LimactlResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

interface LimactlOptions {
    stdin?: string;
    /** Resolve with a non-zero exit code instead of throwing. */
    allowFailure?: boolean;
}

/**
 * The sandbox on macOS: a Lima VM (`poweragents-default`, under `POWERAGENTS_LIMA_HOME`, `~/.poweragents/lima`) that
 * mounts only the profile's data root (`POWERAGENTS_DATA_ROOT`, `~/Poweragents`), running one rootless container with
 * OpenCode. `stop()` stops the whole VM, so a stopped sandbox holds no memory; containers and volumes survive in its
 * disk. The agent's image is built from the Containerfile embedded in the daemon, so a compiled daemon needs no file
 * beside it.
 */
export const LimaSandbox = defineService({
    name: 'LimaSandbox',
    implements: Sandbox,
    deps: {
        logger: Logger,
        env: EnvVariables,
        limaDir: POWERAGENTS_LIMA_DIR,
        limaHome: POWERAGENTS_LIMA_HOME,
        dataRoot: POWERAGENTS_DATA_ROOT,
    },
    setup({ logger, env, limaDir, limaHome, dataRoot }): Sandbox {
        const limactlPath = path.join(limaDir, 'bin', 'limactl');
        const passwordFile = path.join(path.dirname(limaHome), 'agent-password');
        const limactlEnv = { ...env, LIMA_HOME: limaHome };

        let state: SandboxState = { status: 'stopped' };
        const stateChanged = createEventEmitter<[state: SandboxState]>();
        const startRunner = createSingleRunner({ handler: startSandbox });
        const verifyRunner = createSingleRunner({ handler: verifyAgent });
        /** When the agent last answered, in ms since the epoch. */
        let agentVerifiedAt = 0;

        return {
            getState: () => state,
            getVerifiedState,
            stateChanged: stateChanged.event,
            start,
            stop,
            exec,
        };

        function start() {
            if (state.status === 'ready') {
                return Promise.resolve(state.endpoint);
            }

            return startRunner.execute();
        }

        async function stop() {
            await startRunner.promise?.catch(() => undefined);

            setState({ status: 'stopping' });
            try {
                if ((await getVmStatus()) === 'Running') {
                    await limactl(['stop', INSTANCE]);
                }
            } catch (error) {
                logger.error('Sandbox failed to stop', { error });
                setState({ status: 'failed', message: getErrorMessage(error) });
                throw error;
            }

            setState({ status: 'stopped' });
        }

        function exec(params: SandboxExecParams): SandboxProcess {
            if (state.status !== 'ready') {
                throw new Error(`Sandbox is not ready: ${state.status}`);
            }

            const command = shellArgs('nerdctl', 'exec', '--interactive', AGENT_CONTAINER, ...params.command);
            const child = Bun.spawn([limactlPath, ...command], {
                env: limactlEnv,
                stdin: 'pipe',
                stdout: 'pipe',
                stderr: 'pipe',
            });
            return {
                stdin: {
                    write: chunk => void child.stdin.write(chunk),
                    end: () => void child.stdin.end(),
                },
                stdout: child.stdout,
                stderr: child.stderr,
                exited: child.exited,
                kill: () => child.kill(),
            };
        }

        async function getVerifiedState() {
            if (state.status === 'ready' && Date.now() - agentVerifiedAt >= AGENT_VERIFY_INTERVAL_MS) {
                await verifyRunner.execute();
            }
            return state;
        }

        /**
         * Starts the sandbox again when a ready sandbox's agent stopped answering (its container or the VM died, the
         * computer slept through a VM stop). A few attempts, so a busy agent is not mistaken for a dead one: `start()`
         * recreates the container, which would end the agent's work.
         */
        async function verifyAgent() {
            if (state.status !== 'ready') {
                return;
            }

            const endpoint = state.endpoint;
            for (let attempt = 1; attempt <= AGENT_VERIFY_ATTEMPTS; attempt++) {
                if (await isAgentReady(endpoint)) {
                    agentVerifiedAt = Date.now();
                    return;
                }
                await Bun.sleep(AGENT_VERIFY_RETRY_MS);
            }

            logger.warn('Sandbox agent stopped answering', { attempts: AGENT_VERIFY_ATTEMPTS });
            // Leaves `ready` synchronously (`startingVm`), so no caller sees a dead agent as ready; a failure is logged
            // by the start and leaves the sandbox `failed`.
            startRunner.execute().catch(() => undefined);
        }

        async function startSandbox(): Promise<SandboxEndpoint> {
            try {
                setState({ status: 'startingVm' });
                await startVm();
                await applyHostFirewall();

                const image = getImageTag();
                if (!(await imageExists(image))) {
                    setState({ status: 'buildingImage' });
                    await buildImage(image);
                    await removeSupersededImages(image);
                    await restartVm();
                }

                setState({ status: 'startingAgent' });
                const endpoint = await startAgent(image);

                agentVerifiedAt = Date.now();
                setState({ status: 'ready', endpoint });
                return endpoint;
            } catch (error) {
                logger.error('Sandbox failed to start', { error });
                setState({ status: 'failed', message: getErrorMessage(error) });
                throw error;
            }
        }

        async function startVm() {
            const stopwatch = createStopwatch();
            await mkdir(dataRoot, { recursive: true });
            await mkdir(limaHome, { recursive: true });

            const status = await getVmStatus();
            if (status === 'Running') {
                return;
            }

            if (status === undefined) {
                await createVm();
            } else {
                await limactl(['start', '--tty=false', INSTANCE]);
            }

            logger.info('Sandbox VM started', { created: status === undefined, durationMs: stopwatch.duration() });
        }

        async function createVm() {
            const configDir = await mkdtemp(path.join(os.tmpdir(), 'poweragents-lima-'));
            try {
                const configFile = path.join(configDir, `${INSTANCE}.yaml`);
                const config = buildLimaConfig({
                    dataRoot,
                    dataMountPoint: AGENT_DATA_ROOT,
                    agentPort: AGENT_HOST_PORT,
                    memoryGiB: VM_MEMORY_GIB,
                });
                await writeFile(configFile, config);
                await limactl(['start', '--tty=false', `--name=${INSTANCE}`, configFile]);
            } finally {
                await rm(configDir, { recursive: true, force: true });
            }
        }

        /**
         * Closes the host and its private networks to the VM and its containers, now and on every boot
         * (`nftables.service` loads the saved file before the network comes up). Applied on every start rather than by
         * a Lima provision script: Lima reads its config only when it creates the VM, and this way an existing VM gets
         * the rules, and changed `FIREWALL_OPENINGS`, too.
         */
        async function applyHostFirewall() {
            const rules = buildHostFirewall({ hostGateway: HOST_GATEWAY, openings: FIREWALL_OPENINGS });
            const script = `cat > ${FIREWALL_FILE} && nft --file ${FIREWALL_FILE} && systemctl enable --quiet nftables`;
            await limactl(shellArgs('sudo', 'sh', '-c', script), { stdin: rules });
        }

        /** The VM's status as Lima reports it (`Running`, `Stopped`, …), or `undefined` when it does not exist. */
        async function getVmStatus() {
            // Lima exits non-zero ("unmatched instances") when there is no such VM.
            const result = await limactl(['list', '--format', '{{.Status}}', INSTANCE], { allowFailure: true });
            return result.exitCode === 0 ? result.stdout.trim() : undefined;
        }

        /** The image is named after its Containerfile, so a changed Containerfile gets a new image. */
        function getImageTag() {
            const hash = new Bun.CryptoHasher('sha256').update(AGENT_CONTAINERFILE).digest('hex');
            return `${IMAGE_REPOSITORY}:${hash.slice(0, 12)}`;
        }

        async function imageExists(image: string) {
            const result = await limactl(shellArgs('nerdctl', 'image', 'inspect', image), { allowFailure: true });
            return result.exitCode === 0;
        }

        async function buildImage(image: string) {
            const stopwatch = createStopwatch();
            const script = `mkdir -p ${BUILD_DIR} && cat > ${BUILD_DIR}/Containerfile`;
            await limactl(shellArgs('sh', '-c', script), { stdin: AGENT_CONTAINERFILE });
            await limactl(shellArgs('nerdctl', 'build', '--tag', image, BUILD_DIR));
            logger.info('Sandbox image built', { image, durationMs: stopwatch.duration() });
        }

        /**
         * Deletes the agent's images other than `image`: each takes about 1.4 GB of the VM's disk and none runs again.
         * The agent's container goes first, as it runs an older image and would be recreated anyway. A failure here
         * leaves only disk space taken, so it does not stop the start.
         */
        async function removeSupersededImages(image: string) {
            await limactl(shellArgs('nerdctl', 'rm', '--force', AGENT_CONTAINER), { allowFailure: true });

            const format = '{{.Repository}}:{{.Tag}}';
            const list = await limactl(shellArgs('nerdctl', 'image', 'ls', '--format', format, IMAGE_REPOSITORY));
            const superseded = list.stdout
                .split('\n')
                .map(line => line.trim())
                .filter(tag => tag.startsWith(`${IMAGE_REPOSITORY}:`) && tag !== image);
            if (superseded.length === 0) {
                return;
            }

            const result = await limactl(shellArgs('nerdctl', 'image', 'rm', ...superseded), { allowFailure: true });
            if (result.exitCode === 0) {
                logger.info('Superseded sandbox images removed', { images: superseded.join(' ') });
            } else {
                logger.warn('Superseded sandbox images not removed', {
                    images: superseded.join(' '),
                    stderr: result.stderr.slice(-4000),
                });
            }
        }

        /**
         * Returns the memory the image build touched to the computer: Lima's vz VM keeps every guest page until it
         * restarts, and a build leaves about 1.4 GB of them behind.
         */
        async function restartVm() {
            const stopwatch = createStopwatch();
            await limactl(['stop', INSTANCE]);
            await limactl(['start', '--tty=false', INSTANCE]);
            logger.info('Sandbox VM restarted after the image build', { durationMs: stopwatch.duration() });
        }

        /**
         * Reuses the agent's container when it runs with the current spec (image and options) and answers to the stored
         * password; recreates it when it is missing, stopped or outdated. The password outlives the daemon, so a daemon
         * started again finds the agent it left running.
         */
        async function startAgent(image: string): Promise<SandboxEndpoint> {
            const stopwatch = createStopwatch();
            const password = await readOrCreatePassword(passwordFile);
            const endpoint: SandboxEndpoint = {
                url: `http://127.0.0.1:${AGENT_HOST_PORT}`,
                username: 'opencode',
                password,
            };
            const run = buildAgentRunArgs(image);

            if ((await getRunningAgentSpec()) === run.spec && (await isAgentReady(endpoint))) {
                logger.info('Sandbox agent reused', { image, durationMs: stopwatch.duration() });
                return endpoint;
            }

            await limactl(shellArgs('nerdctl', 'rm', '--force', AGENT_CONTAINER), { allowFailure: true });
            await limactl(shellArgs('nerdctl', ...run.args), { stdin: `OPENCODE_SERVER_PASSWORD=${password}\n` });

            await waitUntil(() => isAgentReady(endpoint), {
                intervalMs: 500,
                timeoutMs: AGENT_READY_TIMEOUT_MS,
                onTimeout: () => {
                    throw new Error(`The agent did not answer within ${AGENT_READY_TIMEOUT_MS} ms`);
                },
            });

            logger.info('Sandbox agent started', { image, durationMs: stopwatch.duration() });
            return endpoint;
        }

        /** The spec label of the agent's container while it runs; `undefined` when it is stopped or missing. */
        async function getRunningAgentSpec() {
            const format = `{{.State.Running}} {{index .Config.Labels "${AGENT_SPEC_LABEL}"}}`;
            const result = await limactl(
                shellArgs('nerdctl', 'container', 'inspect', '--format', format, AGENT_CONTAINER),
                {
                    allowFailure: true,
                },
            );
            const [running, spec] = result.stdout.trim().split(' ');
            return result.exitCode === 0 && running === 'true' ? spec : undefined;
        }

        async function isAgentReady(endpoint: SandboxEndpoint) {
            const credentials = btoa(`${endpoint.username}:${endpoint.password}`);
            try {
                const response = await fetch(`${endpoint.url}/api/session`, {
                    headers: { Authorization: `Basic ${credentials}` },
                    signal: AbortSignal.timeout(2000),
                });
                return response.ok;
            } catch {
                // Not listening yet: the port forward or OpenCode is still coming up.
                return false;
            }
        }

        /** `limactl shell` arguments running a command in the VM, from `/` (not the host's working directory). */
        function shellArgs(...command: string[]) {
            return ['shell', '--workdir', '/', INSTANCE, ...command];
        }

        async function limactl(args: string[], options: LimactlOptions = {}): Promise<LimactlResult> {
            const child = Bun.spawn([limactlPath, ...args], {
                env: limactlEnv,
                stdin: options.stdin == null ? 'ignore' : new TextEncoder().encode(options.stdin),
                stdout: 'pipe',
                stderr: 'pipe',
            });
            const [stdout, stderr, exitCode] = await Promise.all([
                new Response(child.stdout).text(),
                new Response(child.stderr).text(),
                child.exited,
            ]);

            if (exitCode !== 0 && !options.allowFailure) {
                throw new ApplicationError(`limactl ${args[0]} failed with exit code ${exitCode}`, {
                    args: args.join(' '),
                    stderr: stderr.slice(-4000),
                });
            }

            return { exitCode, stdout, stderr };
        }

        function setState(next: SandboxState) {
            state = next;
            logger.debug('Sandbox state changed', { status: next.status });
            stateChanged.emit(next);
        }
    },
});

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}
