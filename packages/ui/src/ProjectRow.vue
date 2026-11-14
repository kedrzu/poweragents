<!-- A project in a list: a folder in the project's colour, its name, and at its end a spinner while the agent works in it, else a pin (App setup) or the new mark (not opened yet); a link to the project, open (selected) or not, or a plain example row. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';
import type { PropType } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import type { ProjectColor } from './ProjectColor.js';

/** What the row's end shows when the agent is not working: `pinned` (App setup, listed first) or `new` (not opened yet). */
export type ProjectRowMark = 'pinned' | 'new';

export const ProjectRowProps = {
  name: { type: String, required: true },
  color: { type: String as PropType<ProjectColor>, required: true },
  /** Where the row leads; without it the row is not a link (an example of a project). */
  to: defineProp<RouteLocationRaw>(),
  /**
   * The project open now: an open folder, a stronger name and `aria-current` — `page` on the project's own screen,
   * `true` while one of its conversations is open.
   */
  selected: defineProp<'page' | 'true'>(),
  /** The agent is working in one of the project's conversations. */
  running: Boolean,
  mark: defineProp<ProjectRowMark>(),
} as const;
</script>

<script lang="ts" setup>
import { Folder, FolderOpen, Pin, Sparkles } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { RouterLink } from 'vue-router';

import * as l from './ProjectRow.loc.js';
import Spinner from './Spinner.vue';

const props = defineProps(ProjectRowProps);

const t = useTranslate();
</script>

<template>
  <component
    :is="props.to ? RouterLink : 'div'"
    :to="props.to"
    :class="[
      $style.projectRow,
      $style[`projectRow_${props.color}`],
      props.to && $style.projectRow_link,
      props.selected && $style.projectRow_selected,
    ]"
    :aria-current="props.selected"
  >
    <component
      :is="props.selected ? FolderOpen : Folder"
      :class="$style.projectRow_icon"
      aria-hidden="true"
    />
    <span :class="$style.projectRow_name">{{ props.name }}</span>
    <Spinner
      v-if="props.running"
      :class="$style.projectRow_spinner"
      :label="t(l.running)"
    />
    <!-- Decoration: App setup is listed first, which says as much. -->
    <Pin
      v-else-if="props.mark === 'pinned'"
      :class="[$style.projectRow_mark, $style.projectRow_mark_pinned]"
      aria-hidden="true"
    />
    <template v-else-if="props.mark === 'new'">
      <Sparkles
        :class="[$style.projectRow_mark, $style.projectRow_mark_new]"
        aria-hidden="true"
      />
      <span :class="$style.projectRow_markLabel">{{ t(l.new) }}</span>
    </template>
  </component>
</template>

<style lang="scss" module>
@include project-color-modifiers(projectRow);

.projectRow {
  display: flex;
  gap: $spacing-12;
  align-items: center;
  min-height: 32px;
  padding: $spacing-06 $spacing-10;
  border-radius: $radius-s;
  color: $color-ink;
  font-size: $font-size-body;
  line-height: $line-height-snug;
  text-decoration: none;
}

.projectRow_link {
  transition: background-color $duration-fast;

  @include focus-ring;
  @include hover {
    background: $color-surface-glass;
  }
}

.projectRow_selected {
  background: $color-surface-glass;
  font-weight: $font-weight-semibold;
}

.projectRow_icon {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--project-color);
}

.projectRow_name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.projectRow_spinner {
  font-size: $font-size-body-l; // 16px, as the folder
}

.projectRow_mark {
  flex: none;
  width: 16px;
  height: 16px;
}

.projectRow_mark_pinned {
  color: $color-ink-muted;
}

.projectRow_mark_new {
  color: $color-brand-1-strong;
}

.projectRow_markLabel {
  @include visually-hidden;
}
</style>
