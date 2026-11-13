<!-- The app's window after the first run: the sidebar on the palette's background beside a white card holding the open screen, with an optional tab bar on top. -->

<script lang="ts" setup>
const slots = defineSlots<{
  /** The sidebar, `ProjectSidebar` for now. */
  sidebar(): unknown;
  /** A bar along the card's top, above a line: the open tabs. */
  header?(): unknown;
  /** The open screen. */
  default(): unknown;
}>();
</script>

<template>
  <div :class="$style.appShell">
    <aside :class="$style.appShell_sidebar">
      <slot name="sidebar" />
    </aside>
    <main :class="$style.appShell_card">
      <div
        v-if="slots.header"
        :class="$style.appShell_header"
      >
        <slot name="header" />
      </div>
      <div :class="$style.appShell_content">
        <slot />
      </div>
    </main>
  </div>
</template>

<style lang="scss" module>
$sidebar-width: 300px;

.appShell {
  display: grid;
  grid-template-columns: $sidebar-width minmax(0, 1fr);
  height: 100vh;
  background: linear-gradient(160deg, $color-bg-1, $color-bg-2);
}

.appShell_sidebar {
  min-height: 0;
  overflow-y: auto;
}

.appShell_card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  margin: $spacing-10 $spacing-10 $spacing-10 0;
  overflow: hidden;
  border-radius: $radius-l;
  background: $color-surface;
}

.appShell_header {
  display: flex;
  flex: none;
  align-items: center;
  min-height: 56px;
  padding: 0 $spacing-12;
  border-bottom: 1px solid $color-border;
}

.appShell_content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}
</style>
