<!-- The main screen with no projects yet: three example projects, what a project is, and a button that creates the first one. -->

<script lang="ts">
export const NoProjectsStateEmits = {
  /** The person asked for their first project. */
  create: () => true,
};
</script>

<script lang="ts" setup>
import { FolderPlus } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { useId } from 'vue';

import Button from './Button.vue';
import ProjectRow from './ProjectRow.vue';
import * as l from './NoProjectsState.loc.js';

const emit = defineEmits(NoProjectsStateEmits);

const t = useTranslate();
const examplesId = useId();
</script>

<template>
  <div :class="$style.noProjectsState">
    <div :class="$style.noProjectsState_examples">
      <p
        :id="examplesId"
        :class="$style.noProjectsState_examplesLabel"
      >
        {{ t(l.forExample) }}
      </p>
      <ul
        :class="$style.noProjectsState_examplesList"
        :aria-labelledby="examplesId"
      >
        <li>
          <ProjectRow
            :name="t(l.exampleJobSearch)"
            color="blue"
          />
        </li>
        <li>
          <ProjectRow
            :name="t(l.exampleHealth)"
            color="pink"
          />
        </li>
        <li>
          <ProjectRow
            :name="t(l.exampleInstagram)"
            color="amber"
          />
        </li>
      </ul>
    </div>
    <h1 :class="$style.noProjectsState_title">
      {{ t(l.title) }}
    </h1>
    <p :class="$style.noProjectsState_body">
      {{ t(l.body) }}
    </p>
    <Button
      :icon="FolderPlus"
      @click="emit('create')"
    >
      {{ t(l.create) }}
    </Button>
  </div>
</template>

<style lang="scss" module>
.noProjectsState {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-48 $spacing-24;
  text-align: center;
}

.noProjectsState_examples {
  display: flex;
  flex-direction: column;
  gap: $spacing-08;
  align-items: center;
  margin-bottom: $spacing-28;
}

.noProjectsState_examplesLabel {
  margin: 0;
  color: $color-ink-muted;
  font-size: $font-size-small;
  line-height: $line-height-snug;
}

.noProjectsState_examplesList {
  width: 260px;
  margin: 0;
  padding: $spacing-08;
  border-radius: $radius-l;
  background: $color-surface-soft;
  list-style: none;
  text-align: left;
}

.noProjectsState_title {
  margin: 0 0 $spacing-12;
  color: $color-ink;
  @include font-heading;
  font-size: $font-size-title-s;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  text-wrap: balance;
}

.noProjectsState_body {
  max-width: 500px;
  margin: 0 0 $spacing-28;
  color: $color-ink-body;
  font-size: $font-size-body-l;
  line-height: $line-height-relaxed;
  text-wrap: pretty;
}
</style>
