import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

/**
 * Opens a web page (or a mail link) in the person's system browser: through the shell's opener plugin in the desktop app
 * (which opens only the web and mail addresses `packages/desktop/src-tauri/capabilities/default.json` allows), in a new
 * tab in a plain browser (dev, e2e).
 * @util
 */
export async function openExternalUrl(url: string) {
    if (isTauri()) {
        await openUrl(url);
        return;
    }

    window.open(url, '_blank', 'noopener');
}
