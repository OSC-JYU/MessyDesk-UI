<script setup>
import { computed } from 'vue'
import EmptyState from '@/ui/EmptyState.vue'
import LoadingState from '@/ui/LoadingState.vue'
import ResultCard from './ResultCard.vue'
import { pageCount, pageOf } from './results.js'

// Paged grid of result cards, shared by Search and Tags. Emits `open` with
// the result and its index in the whole list.
const props = defineProps({
  title: { type: String, required: true },
  results: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  emptyTitle: { type: String, default: 'No results' },
  emptyText: { type: String, default: '' },
  perPage: { type: Number, default: 24 },
})

const page = defineModel('page', { type: Number, default: 1 })
const emit = defineEmits(['open'])

const pages = computed(() => pageCount(props.results.length, props.perPage))
const visible = computed(() => pageOf(props.results, page.value, props.perPage))
const offset = computed(() => (page.value - 1) * props.perPage)
</script>

<template>
  <section class="results" :aria-label="title">
    <header class="results__header">
      <v-icon icon="mdi-folder-search-outline" color="secondary" aria-hidden="true" />
      <h2 class="results__title">{{ title }}</h2>
      <span v-if="results.length" class="results__count">{{ results.length }} files</span>
    </header>

    <div class="results__body">
      <LoadingState v-if="loading" text="Searching…" />
      <EmptyState
        v-else-if="!results.length"
        icon="mdi-folder-search-outline"
        :title="emptyTitle"
        :text="emptyText"
      />
      <div v-else class="results__grid">
        <ResultCard
          v-for="(result, index) in visible"
          :key="result.rid"
          :result="result"
          @open="emit('open', result, offset + index)"
        />
      </div>
    </div>

    <footer v-if="pages > 1" class="results__footer">
      <v-pagination v-model="page" :length="pages" :total-visible="9" density="comfortable" />
    </footer>
  </section>
</template>

<style scoped>
.results {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.results__header {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-3) var(--md-space-5);
  border-bottom: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.results__title {
  margin: 0;
  font-size: var(--md-font-size-lg);
}

.results__count {
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-sm);
}

.results__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--md-space-4) var(--md-space-5);
}

.results__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--md-card-min-width) * 0.85), 1fr));
  gap: var(--md-space-4);
  align-items: start;
}

.results__footer {
  border-top: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}
</style>
