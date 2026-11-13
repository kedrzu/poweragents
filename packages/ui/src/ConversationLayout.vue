<!-- A conversation's screen inside the app shell's card: its messages in a centred column that scrolls and follows new text while it is scrolled to the end, and the composer (with any banner) under it. -->

<script lang="ts">
export const ConversationLayoutEmits = {
  /** The person scrolled to the first message shown: older ones can be loaded above it. */
  reachTop: () => true,
};
</script>

<script lang="ts" setup>
import { useTranslate } from '@nzyme/vue-i18n/useTranslate.js';
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import * as l from './ConversationLayout.loc.js';

defineSlots<{
  /** The messages, oldest first. */
  default(): unknown;
  /** Under the messages: a banner and the composer. */
  footer(): unknown;
}>();
const emit = defineEmits(ConversationLayoutEmits);
defineExpose({ scrollToEnd });

/** How close to the end still counts as at the end, so a pixel of rounding does not stop the following. */
const END_SLACK_PX = 48;

const t = useTranslate();
const scroller = useTemplateRef<HTMLElement>('scroller');
const content = useTemplateRef<HTMLElement>('content');
/** Scrolled to the end: new content keeps it there. */
const atEnd = ref(true);
let observer: ResizeObserver | undefined;

onMounted(() => {
  observer = new ResizeObserver(() => {
    if (atEnd.value) {
      scrollToEnd();
    }
  });
  if (content.value) {
    observer.observe(content.value);
  }
  scrollToEnd();
});

onBeforeUnmount(() => observer?.disconnect());

/** Shows the newest message, and keeps following from there. */
function scrollToEnd() {
  const element = scroller.value;
  if (element) {
    element.scrollTop = element.scrollHeight;
    atEnd.value = true;
  }
}

function onScroll() {
  const element = scroller.value;
  if (!element) {
    return;
  }
  atEnd.value = element.scrollHeight - element.scrollTop - element.clientHeight <= END_SLACK_PX;
  if (element.scrollTop === 0 && element.scrollHeight > element.clientHeight) {
    emit('reachTop');
  }
}
</script>

<template>
  <div :class="$style.conversationLayout">
    <!-- A named, focusable region: the keyboard scrolls the messages even when none of them holds a control. -->
    <div
      ref="scroller"
      :class="$style.conversationLayout_scroller"
      role="region"
      :aria-label="t(l.messages)"
      tabindex="0"
      @scroll.passive="onScroll"
    >
      <div
        ref="content"
        :class="$style.conversationLayout_messages"
      >
        <slot />
      </div>
    </div>
    <div :class="$style.conversationLayout_footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style lang="scss" module>
$column-width: 760px; // the messages and the composer, as screens 56–61 draw them

.conversationLayout {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.conversationLayout_scroller {
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  &:focus-visible {
    outline: 2px solid $color-focus;
    outline-offset: -2px;
  }
}

.conversationLayout_messages {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  max-width: $column-width;
  margin: 0 auto;
  padding: $spacing-24 $spacing-24 $spacing-28;
}

.conversationLayout_footer {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: $spacing-18;
  width: 100%;
  max-width: $column-width;
  margin: 0 auto;
  padding: 0 $spacing-24 $spacing-24;
}
</style>
