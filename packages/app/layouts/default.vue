<script lang="ts" setup></script>

<template>
  <div :class="$style.layout">
    <slot />
  </div>
</template>

<style lang="scss" module>
.layout {
  min-height: 100vh;
}
</style>
