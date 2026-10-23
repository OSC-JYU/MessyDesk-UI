<script setup>
// Spinner with a short label, for a view or panel that is loading. `inline`
// fits it into a line of text instead of centring it in the area.
defineProps({
  text: { type: String, default: 'Loading…' },
  inline: { type: Boolean, default: false },
})
</script>

<template>
  <div
    class="loading-state"
    :class="{ 'loading-state--inline': inline }"
    role="status"
    aria-live="polite"
  >
    <v-progress-circular
      indeterminate
      color="primary"
      :size="inline ? 16 : 32"
      :width="inline ? 2 : 3"
    />
    <span class="loading-state__text">{{ text }}</span>
  </div>
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--md-space-3);
  padding: var(--md-space-6) var(--md-space-4);
  color: var(--md-color-text-muted);
}

.loading-state--inline {
  display: inline-flex;
  flex-direction: row;
  gap: var(--md-space-2);
  padding: 0;
}

.loading-state__text {
  font-size: var(--md-font-size-sm);
}
</style>
