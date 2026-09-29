<script setup>
// Shown where a list or view has nothing to show yet.
defineProps({
  title: { type: String, required: true },
  text: { type: String, default: '' },
  icon: { type: String, default: 'mdi-tray' },
})
</script>

<template>
  <div class="empty-state" role="status">
    <v-icon :icon="icon" size="40" class="empty-state__icon" aria-hidden="true" />
    <p class="empty-state__title">{{ title }}</p>
    <p v-if="text" class="empty-state__text">{{ text }}</p>
    <div v-if="$slots.actions" class="empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-6) var(--md-space-4);
  text-align: center;
  color: var(--md-color-text-muted);
}

.empty-state__icon {
  color: var(--md-color-teal);
  opacity: 0.8;
}

.empty-state__title {
  margin: 0;
  font-size: var(--md-font-size-md);
  font-weight: var(--md-font-weight-medium);
  color: var(--md-color-text);
}

.empty-state__text {
  margin: 0;
  max-width: 48ch;
  font-size: var(--md-font-size-sm);
}

.empty-state__actions {
  margin-block-start: var(--md-space-2);
}
</style>
