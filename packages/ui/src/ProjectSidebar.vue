<!-- The app's sidebar: a New project button in the window bar, Memory, then the projects (each with its mark: App setup's pin, a new project's sparkles), the open one with New conversation and its conversations under it, or a line saying there are none. -->

<script lang="ts">
import { defineProp } from '@nzyme/vue-utils/defineProp.js';
import type { PropType } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import type { ProjectColor } from './ProjectColor.js';
import type { ProjectRowMark } from './ProjectRow.vue';

/** A project as the sidebar lists it. */
export interface ProjectSidebarItem {
  id: string;
  name: string;
  color: ProjectColor;
  /** The project's screen, where a new conversation starts. */
  to: RouteLocationRaw;
  /** Shown at the row's end while the agent does not work in it. */
  mark?: ProjectRowMark;
}

/** A conversation of the open project as the sidebar lists it. */
export interface ProjectSidebarConversation {
  id: string;
  title: string;
  /** The conversation's screen. */
  to: RouteLocationRaw;
  /** The agent is working on it. */
  running: boolean;
}

export const ProjectSidebarProps = {
  /** The Memory screen. */
  memoryTo: { type: [String, Object] as PropType<RouteLocationRaw>, required: true },
  /** The Memory screen is open. */
  memorySelected: Boolean,
  /** In the order they are listed. */
  projects: { type: Array as PropType<readonly ProjectSidebarItem[]>, required: true },
  /** The id of the project open now. */
  selectedId: defineProp<string>(),
  /** The open project's conversations, newest first. */
  conversations: { type: Array as PropType<readonly ProjectSidebarConversation[]>, default: () => [] },
  /** The id of the conversation open now; none while the open project's screen (a new conversation) shows. */
  selectedConversationId: defineProp<string>(),
} as const;

export const ProjectSidebarEmits = {
  /** The person asked for a new project. */
  create: () => true,
};
</script>

<script lang="ts" setup>
import { Brain, FolderPlus } from '@lucide/vue';
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { computed, useId } from 'vue';
import { RouterLink } from 'vue-router';

import Button from './Button.vue';
import ConversationRow from './ConversationRow.vue';
import ProjectRow from './ProjectRow.vue';
import * as l from './ProjectSidebar.loc.js';

const props = defineProps(ProjectSidebarProps);
const emit = defineEmits(ProjectSidebarEmits);

const t = useTranslate();
const headingId = useId();
const running = computed(() => props.conversations.some(conversation => conversation.running));
</script>

<template>
  <div :class="$style.projectSidebar">
    <div :class="$style.projectSidebar_windowBar">
      <Button
        :icon="FolderPlus"
        @click="emit('create')"
      >
        {{ t(l.newProject) }}
      </Button>
    </div>
    <nav
      :class="$style.projectSidebar_nav"
      :aria-label="t(l.navigation)"
    >
      <RouterLink
        :to="props.memoryTo"
        :class="[$style.projectSidebar_navItem, props.memorySelected && $style.projectSidebar_navItem_selected]"
        :aria-current="props.memorySelected ? 'page' : undefined"
      >
        <Brain
          :class="$style.projectSidebar_navIcon"
          aria-hidden="true"
        />
        {{ t(l.memory) }}
      </RouterLink>
    </nav>
    <nav
      :class="$style.projectSidebar_section"
      :aria-labelledby="headingId"
    >
      <h2
        :id="headingId"
        :class="$style.projectSidebar_heading"
      >
        {{ t(l.projects) }}
      </h2>
      <ul
        v-if="props.projects.length"
        :class="$style.projectSidebar_list"
      >
        <li
          v-for="project in props.projects"
          :key="project.id"
        >
          <ProjectRow
            :name="project.name"
            :color="project.color"
            :to="project.to"
            :selected="project.id === props.selectedId ? (props.selectedConversationId ? 'true' : 'page') : undefined"
            :running="project.id === props.selectedId && running"
            :mark="project.mark"
          />
          <ul
            v-if="project.id === props.selectedId"
            :class="$style.projectSidebar_conversations"
          >
            <li>
              <ConversationRow
                kind="new"
                :label="t(l.newConversation)"
                :to="project.to"
                :selected="!props.selectedConversationId"
              />
            </li>
            <li
              v-for="conversation in props.conversations"
              :key="conversation.id"
            >
              <ConversationRow
                :label="conversation.title"
                :to="conversation.to"
                :selected="conversation.id === props.selectedConversationId"
                :running="conversation.running"
              />
            </li>
          </ul>
        </li>
      </ul>
      <p
        v-else
        :class="$style.projectSidebar_empty"
      >
        {{ t(l.noProjects) }}
      </p>
    </nav>
  </div>
</template>

<style lang="scss" module>
$window-bar-height: 48px; // where the window's own buttons sit, beside the New project button

.projectSidebar {
  display: flex;
  flex-direction: column;
  gap: $spacing-18;
  padding: $spacing-10 $spacing-18 $spacing-18;
}

.projectSidebar_windowBar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-height: $window-bar-height;
}

.projectSidebar_nav {
  display: flex;
  flex-direction: column;
}

.projectSidebar_navItem {
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
  transition: background-color $duration-fast;

  @include focus-ring;
  @include hover {
    background: $color-surface-glass;
  }
}

.projectSidebar_navItem_selected {
  background: $color-surface-glass;
  font-weight: $font-weight-semibold;
}

.projectSidebar_navIcon {
  flex: none;
  width: 16px;
  height: 16px;
  color: $color-ink-muted;
}

.projectSidebar_section {
  display: flex;
  flex-direction: column;
  gap: $spacing-08;
}

.projectSidebar_heading {
  margin: 0;
  padding: 0 $spacing-10;
  // The design draws it in `$ink-faint`, which fails text contrast on the sidebar's background.
  color: $color-ink-body;
  font-size: $font-size-small;
  font-weight: $font-weight-regular;
  line-height: $line-height-snug;
}

.projectSidebar_list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.projectSidebar_conversations {
  display: flex;
  flex-direction: column;
  gap: $spacing-02;
  margin: $spacing-04 0 $spacing-08;
  padding: 0 0 0 $spacing-16;
  list-style: none;
}

.projectSidebar_empty {
  margin: 0;
  padding: 0 $spacing-10;
  color: $color-ink-body;
  font-size: $font-size-body;
  line-height: $line-height-normal;
}
</style>
