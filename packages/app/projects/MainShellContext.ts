import { defineContext } from '@nzyme/vue-utils/context.js';
import { reactive } from 'vue';

/** What the main shell (`MainShell.vue`) offers the screen open in it. */
export const MainShellContext = defineContext('MainShellContext', () =>
    reactive({
        /** Whether the new-project dialog shows. */
        newProjectOpen: false,
    }),
);
