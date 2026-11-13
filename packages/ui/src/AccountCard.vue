<!-- The AI account the agent is signed in with: the provider, the account's email, and a check once it is connected. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';
import type { PropType } from 'vue';

import type { AiProvider } from './ProviderTile.vue';

export const AccountCardProps = {
  provider: { type: String as PropType<AiProvider>, required: true },
  /** The provider's name as people know it. */
  name: { type: String, required: true },
  /** The account's email; the provider does not always report one. */
  email: defineProp<string>(),
  /** The agent works with this account: a check, announced as "Connected". */
  connected: Boolean,
} as const;
</script>

<script lang="ts" setup>
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';

import * as l from './AccountCard.loc.js';
import CheckBadge from './CheckBadge.vue';
import ProviderTile from './ProviderTile.vue';

const props = defineProps(AccountCardProps);

const t = useTranslate();
</script>

<template>
  <div :class="$style.accountCard">
    <ProviderTile :provider="props.provider" />
    <div :class="$style.accountCard_text">
      <span :class="$style.accountCard_name">{{ props.name }}</span>
      <span
        v-if="props.email"
        :class="$style.accountCard_email"
        >{{ props.email }}</span
      >
    </div>
    <CheckBadge
      v-if="props.connected"
      :label="t(l.connected)"
    />
  </div>
</template>

<style lang="scss" module>
.accountCard {
  display: flex;
  gap: $spacing-16;
  align-items: center;
  padding: $spacing-14 $spacing-18;
  border-radius: $radius-l;
  background: $color-surface-soft;
}

.accountCard_text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $spacing-02;
  min-width: 0;
}

.accountCard_name {
  color: $color-ink;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  line-height: $line-height-snug;
}

.accountCard_email {
  overflow: hidden;
  color: $color-ink-body;
  font-size: $font-size-small;
  line-height: $line-height-snug;
  text-overflow: ellipsis;
}
</style>
