<!-- Small square with an AI provider's icon, in the provider's colour or greyed when the provider is not available. -->

<script lang="ts">
import type { PropType } from 'vue';

/** The AI providers the agent can run on. */
export type AiProvider = 'claude' | 'chatgpt';

export const ProviderTileProps = {
  provider: { type: String as PropType<AiProvider>, required: true },
  /** Greyed, for a provider that is not available yet. */
  muted: Boolean,
} as const;
</script>

<script lang="ts" setup>
import { Asterisk, MessageCircle } from '@lucide/vue';
import { assertNever } from '@nzyme/utils/assertNever.js';
import { computed } from 'vue';

const props = defineProps(ProviderTileProps);

const icon = computed(() => {
  switch (props.provider) {
    case 'claude':
      return Asterisk;
    case 'chatgpt':
      return MessageCircle;
    default:
      return assertNever(props.provider);
  }
});
</script>

<template>
  <!-- Decoration: the provider's name always stands beside it. -->
  <span
    :class="[$style.providerTile, props.muted && $style.providerTile_muted]"
    aria-hidden="true"
  >
    <component
      :is="icon"
      :class="$style.providerTile_icon"
    />
  </span>
</template>

<style lang="scss" module>
.providerTile {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: $radius-s;
  background: $color-project-coral-soft;
  color: $color-project-coral;
}

.providerTile_muted {
  background: $color-project-slate-soft;
  color: $color-project-slate;
}

.providerTile_icon {
  width: 15px;
  height: 15px;
}
</style>
