<script setup>
// Card with a small overline and a title, used for the panels of a screen.
defineProps({
  title: { type: String, required: true },
  overline: { type: String, default: '' },
})
</script>

<template>
  <v-card class="section-card" rounded="lg" flat>
    <header class="section-card__header">
      <div>
        <p v-if="overline" class="section-card__overline">{{ overline }}</p>
        <h2 class="section-card__title">{{ title }}</h2>
      </div>
      <div v-if="$slots.actions" class="section-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="section-card__body">
      <slot />
    </div>
  </v-card>
</template>

<style scoped>
.section-card {
  border: 1px solid var(--md-color-border);
  box-shadow: var(--md-shadow-1);
}

.section-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--md-space-3);
  padding: var(--md-space-4) var(--md-space-5) var(--md-space-2);
}

.section-card__overline {
  margin: 0;
  font-size: var(--md-font-size-xs);
  font-weight: var(--md-font-weight-medium);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--md-color-text-muted);
}

.section-card__title {
  margin: 0;
  font-size: var(--md-font-size-xl);
  line-height: 1.3;
}

.section-card__actions {
  display: flex;
  gap: var(--md-space-2);
}

.section-card__body {
  padding: var(--md-space-2) var(--md-space-5) var(--md-space-5);
}
</style>
