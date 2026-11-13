/** Params of `buildLimaConfig()`. */
export interface BuildLimaConfigParams {
    /** The profile's data root on the host; the only host directory the VM sees. */
    dataRoot: string;
    /** Where the data root appears in the VM. */
    dataMountPoint: string;
    /** The guest port the agent is published on; forwarded to the same port on the host's loopback. */
    agentPort: number;
    /** The VM's memory. Lima applies it only when it creates the VM; `LimaSandbox` brings an existing VM to it. */
    memoryGiB: number;
}

/**
 * Builds the Lima instance config of the sandbox VM, as JSON (which Lima reads as YAML).
 *
 * The base is an image-only template: `template:default` would add Lima's writable mount of the user's home. Only the
 * agent's port is forwarded, to the host's loopback; every other guest port is ignored.
 * @__NO_SIDE_EFFECTS__
 */
export function buildLimaConfig(params: BuildLimaConfigParams): string {
    const config = {
        minimumLimaVersion: '2.0.0',
        base: ['template:_images/ubuntu-lts'],
        vmType: 'vz',
        cpus: 4,
        memory: `${params.memoryGiB}GiB`,
        disk: '30GiB',
        mountType: 'virtiofs',
        mounts: [{ location: params.dataRoot, mountPoint: params.dataMountPoint, writable: true }],
        containerd: { system: false, user: true },
        ssh: { forwardAgent: false, loadDotSSHPubKeys: false },
        portForwards: [
            { guestPort: params.agentPort, hostIP: '127.0.0.1' },
            // `guestIPMustBeZero: false` makes 0.0.0.0 match every guest address, so nothing escapes through Lima's
            // fallback rule, which forwards any port bound on the guest's loopback.
            { guestIP: '0.0.0.0', guestIPMustBeZero: false, proto: 'any', ignore: true },
        ],
    };

    return JSON.stringify(config, null, 2);
}
