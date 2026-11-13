<!-- A failure the person should know about, in a soft attention box: what failed and what to do about it. Announced as it appears. -->

<script lang="ts">
export const ErrorNoticeProps = {
  /** What failed, in a few words. */
  title: { type: String, required: true },
  /** Why, if it is known, and what the person can do. */
  body: { type: String, required: true },
} as const;
</script>

<script lang="ts" setup>
import { CircleAlert } from '@lucide/vue';

const props = defineProps(ErrorNoticeProps);
</script>

<template>
  <div
    :class="$style.errorNotice"
    role="alert"
  >
    <CircleAlert
      :class="$style.errorNotice_icon"
      aria-hidden="true"
    />
    <div :class="$style.errorNotice_text">
      <p :class="$style.errorNotice_title">
        {{ props.title }}
      </p>
      <p :class="$style.errorNotice_body">
        {{ props.body }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" module>
.errorNotice {
  display: flex;
  gap: $spacing-10;
  padding: $spacing-14;
  border-radius: $radius-m;
  background: $color-attention-soft;
}

.errorNotice_icon {
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: $spacing-first-line-nudge;
  color: $color-attention-ink;
}

.errorNotice_text {
  display: flex;
  flex-direction: column;
  gap: $spacing-02;
}

.errorNotice_title {
  margin: 0;
  color: $color-ink;
  font-size: $font-size-body;
  font-weight: $font-weight-semibold;
  line-height: $line-height-snug;
}

.errorNotice_body {
  margin: 0;
  color: $color-ink-body;
  font-size: $font-size-small;
  line-height: $line-height-normal;
}
</style>
