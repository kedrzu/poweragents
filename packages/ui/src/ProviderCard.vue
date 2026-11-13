<!-- Card of an AI provider the agent can run on, with its plans and a Connect button; greyed with a badge when not available yet. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';
import type { PropType } from 'vue';

import type { AiProvider } from './ProviderTile.vue';

export const ProviderCardProps = {
  provider: { type: String as PropType<AiProvider>, required: true },
  /** The provider's name as people know it. */
  name: { type: String, required: true },
  /** Which of the provider's plans work, in a sentence. */
  plans: { type: String, required: true },
  connectLabel: { type: String, required: true },
  /** A badge ("Soon") marking the provider as not available yet; its card is greyed and cannot connect. */
  unavailableBadge: defineProp<string>(),
} as const;

export const ProviderCardEmits = {
  /** The person chose this provider. The button stays busy while an async listener runs. */
  connect: () => true,
};
</script>

<script lang="ts" setup>
import { ArrowUpRight } from '@lucide/vue';
import { useEmitAsync } from '@nzyme/vue-utils/useEmitAsync.js';

import Button from './Button.vue';
import ProviderTile from './ProviderTile.vue';

const props = defineProps(ProviderCardProps);
defineEmits(ProviderCardEmits);

const emitAsync = useEmitAsync(ProviderCardEmits);

function connect() {
  return emitAsync('connect');
}
</script>

<template>
  <div :class="[$style.providerCard, props.unavailableBadge && $style.providerCard_unavailable]">
    <div :class="$style.providerCard_top">
      <ProviderTile
        :provider="props.provider"
        :muted="!!props.unavailableBadge"
      />
      <span
        v-if="props.unavailableBadge"
        :class="$style.providerCard_badge"
        >{{ props.unavailableBadge }}</span
      >
    </div>
    <div :class="$style.providerCard_text">
      <h2 :class="$style.providerCard_name">
        {{ props.name }}
      </h2>
      <p :class="$style.providerCard_plans">
        {{ props.plans }}
      </p>
    </div>
    <Button
      :class="$style.providerCard_connect"
      :icon="ArrowUpRight"
      :disabled="!!props.unavailableBadge"
      @click="connect"
    >
      {{ props.connectLabel }}
    </Button>
  </div>
</template>

<style lang="scss" module>
.providerCard {
  --provider-card-name: #{$color-ink};
  --provider-card-plans: #{$color-ink-body};

  display: flex;
  flex-direction: column;
  gap: $spacing-18;
  min-width: 0;
  padding: calc($spacing-22 - 1px);
  border: 1px solid $color-border-strong;
  border-radius: $radius-l;
  background: $color-surface;
}

.providerCard_unavailable {
  --provider-card-name: #{$color-ink-muted};
  --provider-card-plans: #{$color-ink-muted};

  border-color: $color-border;
  background: $color-surface-soft;
}

.providerCard_top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.providerCard_badge {
  padding: calc($spacing-badge-y - 1px) calc($spacing-10 - 1px);
  border: 1px solid $color-border-strong;
  border-radius: $radius-pill;
  background: $color-surface;
  color: $color-ink-muted;
  font-size: $font-size-badge;
  font-weight: $font-weight-semibold;
  line-height: 1.25;
}

.providerCard_text {
  display: flex;
  flex-direction: column;
  gap: $spacing-04;
}

.providerCard_name {
  margin: 0;
  color: var(--provider-card-name);
  @include font-heading;
  font-size: $font-size-heading;
  font-weight: $font-weight-bold;
  line-height: 1.2;
}

.providerCard_plans {
  margin: 0;
  color: var(--provider-card-plans);
  font-size: $font-size-small;
  line-height: $line-height-normal;
}

.providerCard_connect {
  align-self: flex-start;
}
</style>
