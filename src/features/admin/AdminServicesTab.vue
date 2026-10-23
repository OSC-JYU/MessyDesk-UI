<script setup>
import { isRunning } from '@/features/services/serviceStatus.js'

// Read-only list of registered services; controls live on Service control.
defineProps({ services: { type: Array, required: true } })

const headers = [
  { title: 'Service', key: 'name' },
  { title: 'Queue id', key: 'id' },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Status', key: 'status', value: (item) => (isRunning(item) ? 1 : 0) },
  { title: 'Consumers', key: 'consumers', value: (item) => (item.consumers || []).length },
]
</script>

<template>
  <div class="admin-services__toolbar">
    <v-btn variant="text" size="small" prepend-icon="mdi-cog" :to="{ name: 'services-admin' }">
      Open service control
    </v-btn>
  </div>
  <v-data-table :items="services" :headers="headers" density="comfortable" item-value="id">
    <template #[`item.id`]="{ item }"
      ><code>{{ item.id }}</code></template
    >
    <template #[`item.description`]="{ item }">
      {{ item.description }}
      <a
        v-if="item.source_url"
        :href="item.source_url"
        target="_blank"
        rel="noopener"
        class="admin-services__source"
      >
        Source
      </a>
    </template>
    <template #[`item.status`]="{ item }">
      <v-chip :color="isRunning(item) ? 'success' : undefined" size="small" variant="tonal" label>
        {{ isRunning(item) ? 'Running' : 'Stopped' }}
      </v-chip>
    </template>
  </v-data-table>
</template>

<style scoped>
.admin-services__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-block-end: var(--md-space-3);
}

.admin-services__source {
  margin-inline-start: var(--md-space-2);
  color: var(--md-color-primary);
}
</style>
