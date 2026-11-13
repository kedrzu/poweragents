import { defineCommand } from '@nzyme/ioc/Command.js';

import { OpencodeClient } from './OpencodeClient.js';
import { createOpencodeStatusError } from './utils/createOpencodeStatusError.js';

/** A model OpenCode offers. */
export interface OpencodeModel {
    /** What a session's model reference takes, with `providerId`. */
    id: string;
    providerId: string;
    name: string;
}

/** The chat models of every connected provider. A newly connected provider's models appear a moment later. */
export interface OpencodeModelListCommandShape {
    (): Promise<OpencodeModel[]>;
}

/** Lists the chat models OpenCode offers. */
export const OpencodeModelListCommand = defineCommand({
    name: 'OpencodeModelListCommand',
    deps: { client: OpencodeClient },
    setup({ client }): OpencodeModelListCommandShape {
        return async () => {
            const response = await client({ method: 'GET', path: '/api/model' });
            if (response.status !== 200) {
                throw createOpencodeStatusError('listModels', response);
            }
            return response.data.data.map(model => ({ id: model.id, providerId: model.providerID, name: model.name }));
        };
    },
});
