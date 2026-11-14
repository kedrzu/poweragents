import { defineEndpointHandler } from '@nzyme/rpc/defineEndpointHandler.js';

import { AppSetupStartEndpoint } from '@poweragents/common/api/AppSetupStartEndpoint.js';

import { AppSetupService } from '../appSetup/AppSetupService.js';

/** Serves `AppSetupStartEndpoint`. */
export const AppSetupStartEndpointHandler = defineEndpointHandler({
    endpoint: AppSetupStartEndpoint,
    deps: { appSetup: AppSetupService },
    setup({ appSetup }) {
        return input => appSetup.start(input);
    },
});
