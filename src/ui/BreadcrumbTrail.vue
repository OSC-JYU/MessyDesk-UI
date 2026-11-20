<script setup>
// Where the user is: every step but the last is a button that goes back to it, the last is the
// current view. Items: { key, label, icon?, color? }; `select` gives the item that was clicked.
defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: 'Where you are' },
})

const emit = defineEmits(['select'])
</script>

<template>
  <nav class="crumbs" :aria-label="label">
    <template v-for="(item, index) in items" :key="item.key ?? index">
      <v-icon v-if="index" icon="mdi-chevron-right" size="20" aria-hidden="true" />
      <button
        v-if="index < items.length - 1"
        type="button"
        class="crumbs__step"
        :title="item.label"
        @click="emit('select', item)"
      >
        <v-icon
          v-if="item.icon"
          :icon="item.icon"
          :color="item.color"
          size="18"
          aria-hidden="true"
        />
        <span class="crumbs__text">{{ item.label }}</span>
      </button>
      <h2 v-else class="crumbs__current" :title="item.label" aria-current="page">
        <v-icon
          v-if="item.icon"
          :icon="item.icon"
          :color="item.color"
          size="20"
          aria-hidden="true"
        />
        <span class="crumbs__text">{{ item.label }}</span>
      </h2>
    </template>
  </nav>
</template>

<style scoped>
.crumbs {
  display: flex;
  align-items: center;
  gap: var(--md-space-1);
  min-width: 0;
}

.crumbs__step,
.crumbs__current {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  min-width: 0;
  margin: 0;
  font-size: var(--md-font-size-lg);
}

.crumbs__step {
  padding: 0;
  border: 0;
  background: none;
  color: var(--md-color-primary);
  font-family: inherit;
  cursor: pointer;
}

.crumbs__step:hover .crumbs__text {
  text-decoration: underline;
}

.crumbs__current {
  font-weight: var(--md-font-weight-medium);
}

.crumbs__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
