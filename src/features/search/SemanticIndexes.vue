<script setup>
import { computed, onMounted, reactive } from 'vue'
import { getSemanticIndexes } from '@/api/search.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import {
  indexSubtitle,
  indexTitle,
  indexesInScope,
  isSimilarityIndex,
  runSemanticSearch,
} from './semantic.js'

// Semantic search: one panel per vector or similarity (TF-IDF) index (model · what was indexed),
// with its own query field. Emits `results` with { query, index, hits, model } and `loading`
// while a search runs. Similarity indexes match words, not meaning, and have no levels.
const props = defineProps({
  deskRids: { type: Array, default: () => [] },
})
const emit = defineEmits(['results', 'loading'])

const state = reactive({
  indexes: [],
  loaded: false,
  open: null,
  queries: {},
  levels: {},
  running: null,
  error: null,
})

const visible = computed(() => indexesInScope(state.indexes, props.deskRids))

onMounted(async () => {
  try {
    state.indexes = await getSemanticIndexes()
  } catch (error) {
    state.error = error
  } finally {
    state.loaded = true
  }
})

async function search(index) {
  const query = String(state.queries[index.rid] || '').trim()
  if (!query) return
  state.running = index.rid
  state.error = null
  emit('loading', true)
  try {
    const level = isSimilarityIndex(index) ? 'chunk' : state.levels[index.rid] || 'chunk'
    const result = await runSemanticSearch({ index: index.rid, query, level })
    emit('results', {
      query,
      index,
      hits: result.hits || [],
      model: result.model,
      tookMs: result.took_ms,
    })
  } catch (error) {
    state.error = error
  } finally {
    state.running = null
    emit('loading', false)
  }
}
</script>

<template>
  <section class="semantic">
    <h3 class="semantic__heading">Search indexes</h3>
    <p v-if="state.loaded && !visible.length" class="semantic__empty">
      No indexes yet. To search by meaning, run <strong>Embeddings</strong> on a set of texts, then
      <strong>Vector index</strong> on the result. To search by wording, run
      <strong>Similarity index</strong> (Gensim) on a set of texts.
    </p>
    <v-expansion-panels v-model="state.open" variant="accordion">
      <v-expansion-panel v-for="index in visible" :key="index.rid" :value="index.rid">
        <v-expansion-panel-title>
          <span class="semantic__title">
            <span class="semantic__name">{{ indexTitle(index) }}</span>
            <span class="semantic__meta">{{ indexSubtitle(index) }}</span>
          </span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <form role="search" @submit.prevent="search(index)">
            <v-text-field
              v-model="state.queries[index.rid]"
              :label="
                isSimilarityIndex(index)
                  ? 'Words or a passage to look for'
                  : 'Describe what you are looking for'
              "
              variant="outlined"
              density="comfortable"
              :prepend-inner-icon="
                isSimilarityIndex(index) ? 'mdi-text-search' : 'mdi-head-lightbulb-outline'
              "
              hide-details
              :loading="state.running === index.rid"
              :disabled="state.running === index.rid"
            />
          </form>
          <v-btn-toggle
            v-if="!isSimilarityIndex(index)"
            v-model="state.levels[index.rid]"
            density="compact"
            variant="outlined"
            divided
            mandatory
            class="semantic__level"
          >
            <v-btn value="chunk" size="small">Passages</v-btn>
            <v-btn value="doc" size="small">Documents</v-btn>
          </v-btn-toggle>
          <v-alert v-if="index.large" type="info" variant="tonal" density="compact" class="mt-3">
            This is a file-based index: every search reads the whole index, so searches get slower
            as it grows.
          </v-alert>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <ErrorAlert :error="state.error" title="Semantic search failed" class="mt-3" />
  </section>
</template>

<style scoped>
.semantic {
  margin-top: var(--md-space-6);
}

.semantic__heading {
  font-family: var(--md-font-title);
  font-size: var(--md-font-size-lg);
  font-weight: var(--md-font-weight-regular);
  margin-bottom: var(--md-space-3);
}

.semantic__empty {
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-sm);
}

.semantic__title {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-1);
  min-width: 0;
}

.semantic__name {
  font-weight: 600;
  overflow-wrap: anywhere;
}

.semantic__meta {
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-xs);
}

.semantic__level {
  margin-top: var(--md-space-3);
}
</style>
