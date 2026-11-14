import { lstat } from 'node:fs/promises';

import { isErrorCode } from './isErrorCode.js';

/**
 * Whether `dir` is a folder itself, not a link to one; `false` when it does not exist. Anything under the data root may
 * be the agent's, and a link it makes resolves on this computer, so the daemon never reads or writes through one.
 * @util
 */
export async function isRealFolder(dir: string) {
    try {
        return (await lstat(dir)).isDirectory();
    } catch (error) {
        if (isErrorCode(error, 'ENOENT') || isErrorCode(error, 'ENOTDIR')) {
            return false;
        }
        throw error;
    }
}
