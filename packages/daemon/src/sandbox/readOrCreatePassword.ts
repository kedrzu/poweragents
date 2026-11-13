import { randomBytes } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isErrorCode } from '../utils/isErrorCode.js';

/** 24 random bytes in base64url: what this function generates, and the only content it accepts back. */
const PASSWORD_PATTERN = /^[\w-]{32}$/;

/**
 * Reads the password kept in `filePath`, generating it on first use. The file is readable by its owner only (0600), in
 * a directory only its owner can enter (0700); both are tightened if they were created looser. A file that does not
 * hold a password this function generated is replaced, so its content never reaches the caller.
 */
export async function readOrCreatePassword(filePath: string): Promise<string> {
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await chmod(dir, 0o700);

    const existing = await readFile(filePath, 'utf8').catch((error: unknown) => {
        if (isErrorCode(error, 'ENOENT')) {
            return undefined;
        }
        throw error;
    });

    if (existing != null && PASSWORD_PATTERN.test(existing)) {
        await chmod(filePath, 0o600);
        return existing;
    }

    const password = randomBytes(24).toString('base64url');
    // `mode` applies only when the file is created, so tighten a replaced file before writing the secret into it.
    if (existing != null) {
        await chmod(filePath, 0o600);
    }
    await writeFile(filePath, password, { mode: 0o600 });
    return password;
}
