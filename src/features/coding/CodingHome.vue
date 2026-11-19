<script setup>
import { onMounted, reactive } from 'vue'
import { getMyCodingSets } from '@/api/coding.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import LoadingState from '@/ui/LoadingState.vue'

// The sets a user has been asked to code in: other people's texts, one ROI set each.
const state = reactive({ sets: [], loading: true, error: null })

onMounted(async () => {
  try {
    state.sets = (await getMyCodingSets()) || []
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
})
</script>

<template>
  <div class="coding-home">
    <h1 class="coding-home__title">Coding</h1>
    <LoadingState v-if="state.loading" text="Loading…" />
    <ErrorAlert v-else-if="state.error" :error="state.error" title="Could not load your sets" />
    <EmptyState
      v-else-if="!state.sets.length"
      icon="mdi-tag-text-outline"
      title="Nothing to code yet"
      text="When the owner of a desk gives you a set to code, it appears here."
    />
    <ul v-else class="coding-home__list">
      <li v-for="set in state.sets" :key="set.roi_set">
        <router-link
          class="coding-home__item"
          :to="{ name: 'coding-set', params: { set: set.roi_set.replace('#', '') } }"
        >
          <span class="coding-home__name">{{ set.label }}</span>
          <span class="coding-home__meta">
            {{ set.desk }} · {{ set.texts }} {{ set.texts === 1 ? 'text' : 'texts' }}
          </span>
          <v-chip v-if="set.locked" size="x-small" label>Locked</v-chip>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.coding-home {
  max-width: 48rem;
  margin: 0 auto;
  padding: var(--md-space-5);
}

.coding-home__title {
  margin: 0 0 var(--md-space-4);
  font-size: var(--md-font-size-lg);
}

.coding-home__list {
  display: grid;
  gap: var(--md-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.coding-home__item {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  padding: var(--md-space-3);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-md);
  color: inherit;
  text-decoration: none;
}

.coding-home__item:hover {
  background: var(--md-color-bg);
}

.coding-home__name {
  font-weight: 600;
}

.coding-home__meta {
  flex: 1 1 auto;
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-sm);
}
</style>
