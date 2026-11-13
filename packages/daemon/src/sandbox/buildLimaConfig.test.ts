import { expect, test } from 'bun:test';

import { buildLimaConfig } from './buildLimaConfig.js';

const PARAMS = { dataRoot: '/Users/anna/Poweragents', dataMountPoint: '/Poweragents', agentPort: 47611, memoryGiB: 3 };

test('mounts only the profile data root, and no template that brings the home mount', () => {
    const config: unknown = JSON.parse(buildLimaConfig(PARAMS));

    expect(config).toMatchObject({
        mounts: [{ location: '/Users/anna/Poweragents', mountPoint: '/Poweragents', writable: true }],
    });
    // Lima merges a base template's mounts into the instance's; only image templates (`_images/`) carry none.
    expect(config).toHaveProperty('base', [expect.stringMatching(/^template:_images\//)]);
});

test('forwards only the agent port, to the host loopback', () => {
    const config: unknown = JSON.parse(buildLimaConfig(PARAMS));

    expect(config).toHaveProperty('portForwards', [
        { guestPort: 47611, hostIP: '127.0.0.1' },
        { guestIP: '0.0.0.0', guestIPMustBeZero: false, proto: 'any', ignore: true },
    ]);
});
