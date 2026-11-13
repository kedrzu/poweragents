<!-- A short labelled row of things that qualify, each with a check (the plans the agent works with). -->

<script lang="ts">
import type { PropType } from 'vue';

export const CheckListProps = {
  /** What the items have in common, above them; also the list's accessible name. */
  label: { type: String, required: true },
  items: { type: Array as PropType<readonly string[]>, required: true },
} as const;
</script>

<script lang="ts" setup>
import { useId } from 'vue';

import CheckBadge from './CheckBadge.vue';

const props = defineProps(CheckListProps);

const labelId = useId();
</script>

<template>
  <div :class="$style.checkList">
    <p
      :id="labelId"
      :class="$style.checkList_label"
    >
      {{ props.label }}
    </p>
    <ul
      :class="$style.checkList_items"
      :aria-labelledby="labelId"
    >
      <li
        v-for="item in props.items"
        :key="item"
        :class="$style.checkList_item"
      >
        <CheckBadge />
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<style lang="scss" module>
.checkList {
  display: flex;
  flex-direction: column;
  gap: $spacing-10;
}

.checkList_label {
  margin: 0;
  color: $color-ink-body;
  font-size: $font-size-body-s;
  line-height: $line-height-snug;
}

.checkList_items {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-10 $spacing-28;
  margin: 0;
  padding: 0;
  list-style: none;
}

.checkList_item {
  display: flex;
  gap: $spacing-10;
  align-items: center;
  color: $color-ink;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  line-height: $line-height-snug;
}
</style>
