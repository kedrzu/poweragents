<!-- Above the composer, why the agent cannot answer now and what to do: an attention box with a title, a line and an optional action. Announced as it appears. -->

<script lang="ts">
import type { LucideIcon } from '@lucide/vue';
import { defineProp } from '@nzyme/vue-utils/defineProp.js';

export const StatusBannerProps = {
  title: { type: String, required: true },
  body: { type: String, required: true },
  /** The fix, as a button; none when there is nothing the person can do but wait. */
  actionLabel: defineProp<string>(),
  /** An icon from `@lucide/vue` before the action's label. */
  actionIcon: defineProp<LucideIcon>(),
} as const;

export const StatusBannerEmits = {
  /** The person chose the action. The button stays busy while an async listener runs. */
  action: () => true,
};
</script>

<script lang="ts" setup>
import { CircleAlert } from '@lucide/vue';
import { useEmitAsync } from '@nzyme/vue-utils/useEmitAsync.js';

import Button from './Button.vue';

const props = defineProps(StatusBannerProps);
defineEmits(StatusBannerEmits);

const emitAsync = useEmitAsync(StatusBannerEmits);

function act() {
  return emitAsync('action');
}
</script>

<template>
  <div
    :class="$style.statusBanner"
    role="alert"
  >
    <CircleAlert
      :class="$style.statusBanner_icon"
      aria-hidden="true"
    />
    <div :class="$style.statusBanner_text">
      <p :class="$style.statusBanner_title">
        {{ props.title }}
      </p>
      <p :class="$style.statusBanner_body">
        {{ props.body }}
      </p>
    </div>
    <Button
      v-if="props.actionLabel"
      variant="attention"
      :icon="props.actionIcon"
      @click="act"
    >
      {{ props.actionLabel }}
    </Button>
  </div>
</template>

<style lang="scss" module>
.statusBanner {
  display: flex;
  gap: $spacing-14;
  align-items: center;
  padding: $spacing-12 $spacing-14 $spacing-12 $spacing-14;
  border-radius: $radius-m;
  background: $color-attention-soft;
}

.statusBanner_icon {
  flex: none;
  width: 18px;
  height: 18px;
  color: $color-attention-ink;
}

.statusBanner_text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: $spacing-02;
  min-width: 0;
}

.statusBanner_title {
  margin: 0;
  color: $color-ink;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  line-height: $line-height-snug;
}

.statusBanner_body {
  margin: 0;
  color: $color-ink-body;
  font-size: $font-size-control;
  line-height: $line-height-snug;
}
</style>
