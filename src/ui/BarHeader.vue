<script setup>
// The bar at the top of a view (a set, a file, a list of results): the same height, padding
// and border everywhere. The content is up to the view.
defineProps({ label: { type: String, default: '' } })
</script>

<template>
  <header class="bar-header" :aria-label="label || undefined">
    <slot />
  </header>
</template>

<style scoped>
.bar-header {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-3) var(--md-space-5);
  border-bottom: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}
</style>
