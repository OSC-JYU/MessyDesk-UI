<script setup>
// Title row at the top of a screen: title (Junicode), optional subtitle, and
// actions on the right.
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <header class="page-header">
    <div class="page-header__text">
      <h1 class="page-header__title">{{ title }}</h1>
      <p v-if="subtitle || $slots.subtitle" class="page-header__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--md-space-4);
  margin-block-end: var(--md-space-5);
}

.page-header__title {
  margin: 0;
  font-size: var(--md-font-size-2xl);
  line-height: 1.2;
  color: var(--md-color-text);
}

.page-header__subtitle {
  margin: var(--md-space-1) 0 0;
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-sm);
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-space-2);
}
</style>
