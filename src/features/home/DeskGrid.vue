<script setup>
import EmptyState from '@/ui/EmptyState.vue'
import ThumbnailImage from '@/ui/ThumbnailImage.vue'
import DeskActionsMenu from './DeskActionsMenu.vue'

// The user's desks as cards: cover, name, description and the figures of the list. The actions
// menu is the same as in the list.
defineProps({
  rows: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['rename', 'reindex', 'delete'])
</script>

<template>
  <v-skeleton-loader v-if="loading && !rows.length" type="card" />
  <EmptyState
    v-else-if="!rows.length"
    icon="mdi-desk"
    title="No desks yet"
    text="Create your first desk below."
  />
  <ul v-else class="desk-grid">
    <li v-for="row in rows" :key="row.rid" class="desk-grid__item">
      <v-card variant="outlined" rounded="lg" class="desk-grid__card">
        <router-link
          :to="{ name: 'project-graph', params: { rid: row.routeRid } }"
          class="desk-grid__link"
          :aria-label="`Open ${row.name}`"
        >
          <div class="desk-grid__cover">
            <ThumbnailImage v-if="row.cover" :src="row.cover" :alt="''" lazy compact />
            <v-icon v-else icon="mdi-desk" size="48" aria-hidden="true" />
          </div>
        </router-link>
        <div class="desk-grid__footer">
          <router-link
            :to="{ name: 'project-graph', params: { rid: row.routeRid } }"
            class="desk-grid__name"
          >
            {{ row.name }}
          </router-link>
          <DeskActionsMenu
            :row="row"
            @rename="emit('rename', $event)"
            @reindex="emit('reindex', $event)"
            @delete="emit('delete', $event)"
          />
        </div>
        <p v-if="row.description" class="desk-grid__description">{{ row.description }}</p>
        <dl class="desk-grid__details">
          <div>
            <dt>Items</dt>
            <dd>{{ row.itemsText }}</dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{{ row.sizeText }}</dd>
          </div>
          <div>
            <dt>Indexed</dt>
            <dd>{{ row.docsText }}</dd>
          </div>
          <div>
            <dt>Expires</dt>
            <dd>{{ row.expiresText }}</dd>
          </div>
        </dl>
      </v-card>
    </li>
  </ul>
</template>

<style scoped>
.desk-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--md-card-min-width), 1fr));
  gap: var(--md-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.desk-grid__card {
  overflow: hidden;
}

.desk-grid__link {
  display: block;
}

.desk-grid__cover {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--md-color-surface-subtle);
  color: var(--md-color-primary);
}

.desk-grid__cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.desk-grid__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-2);
  padding: var(--md-space-2) var(--md-space-2) var(--md-space-2) var(--md-space-3);
}

.desk-grid__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--md-font-weight-medium);
  color: var(--md-color-primary);
  text-decoration: none;
}

.desk-grid__description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
  padding: 0 var(--md-space-3);
  color: var(--md-color-text-muted);
}

.desk-grid__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--md-space-1) var(--md-space-3);
  margin: 0;
  padding: var(--md-space-2) var(--md-space-3) var(--md-space-3);
  font-size: var(--md-font-size-xs);
}

.desk-grid__details dt {
  color: var(--md-color-text-muted);
}

.desk-grid__details dd {
  margin: 0;
}
</style>
