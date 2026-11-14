<!-- The Memory screen while the folder holds no files: Memory's brain on a violet tile, that it is empty yet, and what will fill it. -->

<script lang="ts" setup>
import { Brain } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';

import * as l from './MemoryEmptyState.loc.js';

const t = useTranslate();
</script>

<template>
  <div :class="$style.memoryEmptyState">
    <span
      :class="$style.memoryEmptyState_tile"
      aria-hidden="true"
    >
      <Brain :class="$style.memoryEmptyState_icon" />
    </span>
    <h1 :class="$style.memoryEmptyState_title">{{ t(l.title) }}</h1>
    <p :class="$style.memoryEmptyState_body">{{ t(l.body) }}</p>
  </div>
</template>

<style lang="scss" module>
.memoryEmptyState {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-48 $spacing-24;
  text-align: center;
}

.memoryEmptyState_tile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-bottom: $spacing-18;
  border-radius: $radius-s;
  background: $color-project-violet-soft;
  color: $color-project-violet;
}

.memoryEmptyState_icon {
  width: 14px;
  height: 14px;
}

.memoryEmptyState_title {
  margin: 0 0 $spacing-12;
  color: $color-ink;
  @include font-heading;
  font-size: $font-size-title-s;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  text-wrap: balance;
}

.memoryEmptyState_body {
  max-width: 500px;
  margin: 0;
  color: $color-ink-body;
  font-size: $font-size-body-l;
  line-height: $line-height-relaxed;
  text-wrap: pretty;
}
</style>
