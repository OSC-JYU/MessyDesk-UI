<script setup>
import EmptyState from '@/ui/EmptyState.vue'

// Sortable list of the user's desks with a menu of actions per desk.
defineProps({
  rows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  sortKey: { type: String, default: 'name' },
  sortDirection: { type: String, default: 'asc' },
})

const emit = defineEmits(['sort', 'open', 'rename', 'reindex', 'delete'])

const columns = [
  { key: 'name', label: 'Desk' },
  { key: 'size', label: 'Size' },
  { key: 'items', label: 'Items' },
  { key: 'docs', label: 'Indexed docs' },
  { key: 'expires', label: 'Expires' },
]
</script>

<template>
  <v-skeleton-loader v-if="loading && !rows.length" type="table-tbody" />
  <EmptyState
    v-else-if="!rows.length"
    icon="mdi-desk"
    title="No desks yet"
    text="Create your first desk below."
  />
  <v-table v-else density="comfortable" class="desk-table">
    <thead>
      <tr>
        <th
          v-for="column in columns"
          :key="column.key"
          :aria-sort="
            sortKey === column.key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'
          "
        >
          <button type="button" class="desk-table__sort" @click="emit('sort', column.key)">
            {{ column.label }}
            <v-icon
              size="small"
              :icon="
                sortKey !== column.key
                  ? 'mdi-swap-vertical'
                  : sortDirection === 'asc'
                    ? 'mdi-arrow-up'
                    : 'mdi-arrow-down'
              "
              :class="{ 'desk-table__sort-icon--idle': sortKey !== column.key }"
            />
          </button>
        </th>
        <th><span class="sr-only">Actions</span></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.rid">
        <td>
          <router-link
            :to="{ name: 'project-graph', params: { rid: row.routeRid } }"
            class="desk-table__name"
          >
            {{ row.name }}
          </router-link>
        </td>
        <td>{{ row.sizeText }}</td>
        <td>{{ row.itemsText }}</td>
        <td>
          <v-chip size="small" variant="tonal" color="secondary" label>{{ row.docsText }}</v-chip>
        </td>
        <td>{{ row.expiresText }}</td>
        <td class="desk-table__actions">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-dots-vertical"
                size="small"
                variant="text"
                :aria-label="`Actions for ${row.name}`"
              />
            </template>
            <v-list density="compact">
              <v-list-item
                prepend-icon="mdi-pencil"
                title="Rename desk"
                @click="emit('rename', row)"
              />
              <v-list-item
                prepend-icon="mdi-refresh"
                title="Re-index search"
                @click="emit('reindex', row)"
              />
              <v-divider />
              <v-list-item
                prepend-icon="mdi-delete-outline"
                title="Delete desk"
                base-color="error"
                @click="emit('delete', row)"
              />
            </v-list>
          </v-menu>
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<style scoped>
.desk-table {
  background: transparent;
}

.desk-table__sort {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  padding: 0;
  border: 0;
  background: none;
  color: var(--md-color-text-muted);
  font: inherit;
  font-weight: var(--md-font-weight-medium);
  cursor: pointer;
}

.desk-table__sort-icon--idle {
  opacity: 0.4;
}

.desk-table__name {
  color: var(--md-color-primary);
  font-weight: var(--md-font-weight-medium);
  text-decoration: none;
}

.desk-table__name:hover {
  text-decoration: underline;
}

.desk-table__actions {
  text-align: end;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
