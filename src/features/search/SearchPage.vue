<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import { search as runSearch } from '@/api/search.js'
import { recall, remember } from '@/stores/pageMemory.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import ResultsGrid from './ResultsGrid.vue'
import ProjectScope from './ProjectScope.vue'
import SemanticIndexes from './SemanticIndexes.vue'
import { isSimilarityIndex, semanticHitToResult } from './semantic.js'
import { searchDocToResult } from './results.js'
import { deskForResults, useFileOpener } from './useFileOpener.js'

// Full-text search, in one desk (/project/:rid/search) or across desks (/search), and search by
// meaning in the user's vector indexes (SemanticIndexes). Both fill the same results grid.
const route = useRoute()
const openResult = useFileOpener()

const inDesk = computed(() => Boolean(route.params.rid))
const scope = computed(() => String(route.params.rid || 'global').replace('#', ''))

const state = reactive({
  query: '',
  // Include OCR misspellings: slower, and finds words one letter apart too.
  fuzzy: false,
  lastQuery: '',
  results: [],
  searched: false,
  page: 1,
  desks: [],
  filterIgnored: false,
  loading: false,
  error: null,
  // 'text' (full-text) or 'semantic'; the title says which results are shown.
  mode: 'text',
  semanticLabel: '',
  semanticKind: '',
})

const deskRids = computed(() => (inDesk.value ? [`#${scope.value}`] : state.desks))

async function search() {
  const query = String(state.query || '').trim()
  if (!query) {
    Object.assign(state, { results: [], searched: false, lastQuery: '', page: 1 })
    return
  }
  state.loading = true
  state.error = null
  try {
    const response = await runSearch(query, {
      projectRids: deskRids.value,
      rows: 500,
      fuzzy: state.fuzzy,
    })
    const docs = response?.response?.docs || []
    state.results = docs.map((doc) => searchDocToResult(doc, response.highlighting))
    state.filterIgnored = Boolean(response?._project_filter_ignored)
    state.lastQuery = query
    state.searched = true
    state.page = 1
    state.mode = 'text'
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
}

function showSemantic({ query, index, hits }) {
  state.results = hits.map(semanticHitToResult)
  state.lastQuery = query
  state.searched = true
  state.page = 1
  state.mode = 'semantic'
  state.semanticLabel = index?.model?.id || ''
  state.semanticKind = isSimilarityIndex(index) ? 'By wording' : 'By meaning'
}

const title = computed(() => {
  if (!state.lastQuery) return 'Search'
  if (state.mode === 'semantic')
    return `${state.semanticKind || 'By meaning'}: ${state.lastQuery} (${state.semanticLabel})`
  return `Search: ${state.lastQuery}`
})

function open(result, index) {
  openResult({
    result,
    index,
    results: state.results,
    query: state.lastQuery,
    projectRid: deskForResults(route.params.rid, state.desks),
  })
}

// Restore what was here last time in this scope, and keep it up to date.
watch(
  scope,
  (key) => {
    const saved = recall('search', key)
    Object.assign(state, {
      query: saved?.query || '',
      lastQuery: saved?.lastQuery || '',
      results: saved?.results || [],
      searched: Boolean(saved?.searched),
      page: saved?.page || 1,
      desks: saved?.desks || [],
      filterIgnored: Boolean(saved?.filterIgnored),
      fuzzy: Boolean(saved?.fuzzy),
      mode: saved?.mode || 'text',
      semanticLabel: saved?.semanticLabel || '',
      semanticKind: saved?.semanticKind || '',
      error: null,
    })
  },
  { immediate: true },
)

watch(
  () => [
    state.lastQuery,
    state.results,
    state.page,
    state.desks,
    state.query,
    state.mode,
    state.fuzzy,
  ],
  () =>
    remember('search', scope.value, {
      query: state.query,
      lastQuery: state.lastQuery,
      results: state.results,
      searched: state.searched,
      page: state.page,
      desks: state.desks,
      filterIgnored: state.filterIgnored,
      fuzzy: state.fuzzy,
      mode: state.mode,
      semanticLabel: state.semanticLabel,
      semanticKind: state.semanticKind,
    }),
  { deep: true },
)

watch(
  () => state.desks,
  () => state.lastQuery && state.mode === 'text' && search(),
  { deep: true },
)
</script>

<template>
  <div class="search-page">
    <ResultsGrid
      v-model:page="state.page"
      class="search-page__results"
      :title="title"
      :results="state.results"
      :loading="state.loading"
      :empty-title="state.searched ? 'No matches' : 'Search the text of your files'"
      :empty-text="
        state.searched
          ? state.mode === 'semantic'
            ? 'Nothing in this index matched.'
            : 'Try other words, or search all desks.'
          : 'Type words in the search box and press Enter.'
      "
      @open="open"
    />

    <aside class="search-page__side">
      <form role="search" @submit.prevent="search">
        <v-text-field
          v-model="state.query"
          label="Search text"
          variant="outlined"
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          clearable
          autofocus
          hide-details
          class="mb-4"
          @click:clear="search"
        />
        <v-checkbox
          v-model="state.fuzzy"
          label="Include OCR misspellings"
          hint="Also finds words one letter different. Slower, and finds some unrelated words."
          persistent-hint
          density="compact"
          class="mb-4"
          @update:model-value="state.query && search()"
        />
      </form>
      <ProjectScope v-if="!inDesk" v-model="state.desks" hint="None selected: all your desks." />
      <v-alert
        v-if="state.filterIgnored && deskRids.length"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        Limiting search to desks is not available in the backend yet. Showing results from all
        desks.
      </v-alert>
      <ErrorAlert :error="state.error" title="Search failed" class="mt-4" />
      <SemanticIndexes
        :desk-rids="deskRids"
        @loading="state.loading = $event"
        @results="showSemantic"
      />
    </aside>
  </div>
</template>

<style scoped>
.search-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) calc(var(--md-card-min-width) * 1.2);
  height: 100%;
}

.search-page__results {
  min-width: 0;
}

.search-page__side {
  padding: var(--md-space-5) var(--md-space-4);
  border-inline-start: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
  overflow-y: auto;
}
</style>
