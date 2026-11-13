<!-- The agent's mark: a sparkle on a tile in the palette's brand gradient. Decorative; the name beside it speaks. -->

<script lang="ts" setup>
import { Sparkle } from '@lucide/vue';
</script>

<template>
  <span
    :class="$style.agentMark"
    aria-hidden="true"
  >
    <Sparkle :class="$style.agentMark_icon" />
  </span>
</template>

<style lang="scss" module>
.agentMark {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: $radius-mark;
  background: linear-gradient(135deg, $color-brand-1, $color-brand-2);
  color: $color-on-ink;
}

.agentMark_icon {
  width: 15px;
  height: 15px;
}
</style>
