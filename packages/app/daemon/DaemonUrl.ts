import { defineInterface } from '@nzyme/ioc/Interface.js';

/** The daemon's base URL (`runtimeConfig.public.daemonUrl`), which the app's container registers. */
export const DaemonUrl = defineInterface<string>({ name: 'DaemonUrl' });
