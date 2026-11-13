<script setup>
import { settings, DESK_VIEW_OPTIONS } from '@/stores/settings.js'

// How the front page looks: the desks as a grid or a list, and whether the "Learn MessyDesk"
// card with the demo desks is shown. `choose` saves a setting (SettingsPage).
import SectionCard from '@/ui/SectionCard.vue'

const props = defineProps({
  choose: { type: Function, required: true },
})
</script>

<template>
  <SectionCard title="Front page" overline="Desks">
    <v-checkbox
      :model-value="settings.hide_demos !== 'on'"
      label="Show the Learn MessyDesk demo desks"
      color="primary"
      hide-details
      @update:model-value="props.choose('hide_demos', $event ? 'off' : 'on')"
    />
    <p class="front-page__hint">Demo desks are ready-made examples you can copy and explore.</p>
    <v-btn-toggle
      :model-value="settings.desk_view"
      mandatory
      color="primary"
      variant="outlined"
      density="comfortable"
      class="mt-4"
      aria-label="Desk view"
      @update:model-value="props.choose('desk_view', $event)"
    >
      <v-btn
        v-for="option in DESK_VIEW_OPTIONS"
        :key="option.value"
        :value="option.value"
        :prepend-icon="option.value === 'grid' ? 'mdi-view-grid-outline' : 'mdi-view-list-outline'"
      >
        {{ option.title }}
      </v-btn>
    </v-btn-toggle>
  </SectionCard>
</template>

<style scoped>
.front-page__hint {
  margin: var(--md-space-1) 0 0;
  color: var(--md-color-text-muted);
}
</style>
