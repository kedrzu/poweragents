import { defineNuxtPlugin } from 'nuxt/app';

import { isExternalLinkUrl } from '@poweragents/common/utils/isExternalLinkUrl.js';

import { openExternalUrl } from '@/utils/openExternalUrl.js';

/**
 * Opens every link meant for a new window (`target="_blank"`: the links in the agent's replies) in the person's browser.
 * The desktop shell's window would otherwise open nothing.
 */
export default defineNuxtPlugin({
    name: 'external-links-plugin',
    setup() {
        document.addEventListener('click', event => {
            const link = event.target instanceof Element ? event.target.closest('a[target="_blank"]') : null;
            if (!(link instanceof HTMLAnchorElement) || !isExternalLinkUrl(link.href)) {
                return;
            }
            event.preventDefault();
            void openExternalUrl(link.href);
        });
    },
});
