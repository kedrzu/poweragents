import { defineCommand } from '@nzyme/ioc/Command.js';
import { Logger } from '@nzyme/logging/Logger.js';

/** What to show in the file manager. */
export interface RevealInFileManagerCommandParams {
    /** An absolute path on this computer, checked by the caller. */
    path: string;
    /** A file is shown selected in its folder; a folder is opened. */
    kind: 'file' | 'folder';
}

/** `unsupported` on a system whose file manager the daemon cannot open yet. */
export type RevealInFileManagerCommandResult = 'revealed' | 'unsupported';

/**
 * Shows a file or a folder in the computer's file manager, on the computer the daemon runs on (the person's own: the
 * daemon is not in the sandbox). Throws when the file manager could not be opened.
 */
export interface RevealInFileManagerCommandShape {
    (params: RevealInFileManagerCommandParams): Promise<RevealInFileManagerCommandResult>;
}

/** macOS's `open`, by its full path: a `PATH` the daemon inherited never chooses which program runs. */
const MACOS_OPEN = '/usr/bin/open';

/** Shows a path in Finder on macOS; other systems are not supported yet. */
export const RevealInFileManagerCommand = defineCommand({
    name: 'RevealInFileManagerCommand',
    deps: { logger: Logger },
    setup({ logger }): RevealInFileManagerCommandShape {
        return async ({ path, kind }) => {
            if (process.platform !== 'darwin') {
                logger.info('Revealing in the file manager is not supported here', { platform: process.platform });
                return 'unsupported';
            }
            // Arguments, never a shell: the path is passed as it is, whatever characters it holds. `--` ends the
            // options, so a path is never read as one.
            const args = kind === 'file' ? ['-R', '--', path] : ['--', path];
            const child = Bun.spawn([MACOS_OPEN, ...args], { stdin: 'ignore', stdout: 'ignore', stderr: 'pipe' });
            const [exitCode, stderr] = await Promise.all([child.exited, new Response(child.stderr).text()]);
            if (exitCode !== 0) {
                throw new Error(`open exited with ${exitCode}: ${stderr.trim()}`);
            }
            return 'revealed';
        };
    },
});
