<script setup>
import { computed, reactive, watch } from 'vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { runSemanticSearch, searchToSimilarity } from '@/features/search/semantic.js'
import SimilarityDisplay from './SimilarityDisplay.vue'

// An index file (similarity_index from Gensim, vector_index from Embeddings) is searched in
// place: paste a text (or describe what you look for) and the matches are shown next to their
// documents. A whole text against a similarity index finds the passages they share (text reuse).
const props = defineProps({ file: { type: Object, required: true } })

const state = reactive({
  query: '',
  threshold: 0.3,
  running: false,
  error: null,
  result: null,
})

const lexical = computed(() => props.file?.type === 'similarity_index')
const similarity = computed(() => (state.result ? searchToSimilarity(state.result) : null))

watch(
  () => props.file?.['@rid'],
  () => Object.assign(state, { query: '', running: false, error: null, result: null }),
)

async function compare() {
  const query = state.query.trim()
  if (!query || state.running) return
  state.running = true
  state.error = null
  try {
    state.result = await runSemanticSearch({
      index: props.file['@rid'],
      query,
      k: 100,
      threshold: lexical.value ? state.threshold : undefined,
    })
  } catch (error) {
    state.error = error
  } finally {
    state.running = false
  }
}
</script>

<template>
  <div class="index">
    <form class="index__form" @submit.prevent="compare">
      <v-textarea
        v-model="state.query"
        :label="
          lexical
            ? 'Paste a text to compare with the indexed texts, or a few words to look for'
            : 'Describe what you are looking for'
        "
        variant="outlined"
        density="comfortable"
        :rows="lexical ? 4 : 2"
        auto-grow
        max-rows="10"
        hide-details
        :disabled="state.running"
        @keydown.ctrl.enter="compare"
      />
      <div class="index__actions">
        <div v-if="lexical" class="index__threshold">
          <span class="index__label">Smallest match {{ Math.round(state.threshold * 100) }}%</span>
          <v-slider
            v-model="state.threshold"
            :min="0.1"
            :max="0.9"
            :step="0.05"
            density="compact"
            hide-details
            color="primary"
          />
        </div>
        <v-btn
          type="submit"
          color="primary"
          :loading="state.running"
          :disabled="!state.query.trim()"
          prepend-icon="mdi-text-search"
        >
          {{ lexical ? 'Compare' : 'Search' }}
        </v-btn>
      </div>
      <p v-if="lexical" class="index__hint">
        A short query lists the passages most like it. A longer text is compared passage by passage;
        passages less alike than the smallest match are left out. Ctrl+Enter compares.
      </p>
      <ErrorAlert :error="state.error" title="The search failed" class="mt-3" />
    </form>

    <div class="index__results">
      <p v-if="similarity && !similarity.chunk_count" class="index__empty">No matches.</p>
      <SimilarityDisplay v-else-if="similarity" :data="similarity" />
    </div>
  </div>
</template>

<style scoped>
.index {
  display: grid;
  grid-template-rows: auto 1fr;
  height: 100%;
  min-height: 0;
}

.index__form {
  padding: var(--md-space-4);
  border-bottom: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.index__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--md-space-4);
  margin-top: var(--md-space-3);
}

.index__threshold {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  flex: 1;
  max-width: 28rem;
}

.index__label {
  white-space: nowrap;
  font-size: var(--md-font-size-sm);
  color: var(--md-color-text-muted);
}

.index__hint {
  margin: var(--md-space-2) 0 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.index__results {
  min-height: 0;
  overflow: hidden;
}

.index__empty {
  padding: var(--md-space-4);
  color: var(--md-color-text-muted);
}
</style>
