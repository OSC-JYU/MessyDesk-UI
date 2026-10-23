<script setup>
import { computed, reactive, watch } from 'vue'
import { getSourceInit } from '@/api/projects.js'
import { MATCH_TYPES, buildSolrQuery, queryString, scopeName } from './dspaceQuery.js'

// Builds a DSpace 7 search for a DSpace source and emits it as `query`
// ({ solrQuery, params: { scope, sort, page, size } }).
const props = defineProps({ sourceRid: { type: String, default: '' } })
const emit = defineEmits(['query'])

const state = reactive({
  hierarchy: [],
  fields: [],
  scope: null,
  criteria: [],
  general: '',
  page: 0,
  size: 10,
  sort: 'score,DESC',
  error: '',
})

const solrQuery = computed(() => buildSolrQuery(state.criteria, state.fields, state.general))
const params = computed(() => ({
  query: solrQuery.value,
  scope: state.scope,
  sort: state.sort.trim(),
  page: state.page,
  size: state.size,
}))
const scopeItems = computed(() =>
  state.hierarchy.flatMap((community) => [
    { title: community.name, value: community.id, props: { class: 'dspace__community' } },
    ...(community.collections || []).map((c) => ({ title: `— ${c.name}`, value: c.id })),
  ]),
)

async function load() {
  if (!props.sourceRid) return
  try {
    const init = await getSourceInit(props.sourceRid)
    state.hierarchy = init?.hierarchy || []
    state.fields = init?.fields || []
  } catch (error) {
    state.error = error?.message || 'Could not load the DSpace collections.'
  }
}

function run() {
  emit('query', {
    solrQuery: solrQuery.value,
    params: { scope: state.scope, sort: params.value.sort, page: state.page, size: state.size },
  })
}

watch(() => props.sourceRid, load, { immediate: true })
</script>

<template>
  <div class="dspace">
    <v-alert v-if="state.error" type="warning" variant="tonal" density="compact" class="mb-3">
      {{ state.error }}
    </v-alert>
    <v-autocomplete
      v-model="state.scope"
      :items="scopeItems"
      label="Scope (optional)"
      placeholder="All items"
      prepend-inner-icon="mdi-folder-search-outline"
      variant="outlined"
      density="compact"
      clearable
    />

    <div v-for="(criterion, index) in state.criteria" :key="index" class="dspace__criterion">
      <v-select
        v-model="criterion.fieldId"
        :items="state.fields"
        item-title="name"
        item-value="id"
        label="Field"
        variant="outlined"
        density="compact"
        hide-details
      />
      <v-select
        v-model="criterion.matchType"
        :items="MATCH_TYPES"
        label="Operator"
        variant="outlined"
        density="compact"
        hide-details
      />
      <v-text-field
        v-model="criterion.value"
        label="Value"
        variant="outlined"
        density="compact"
        hide-details
      />
      <v-btn
        icon="mdi-close"
        size="small"
        variant="text"
        :aria-label="`Remove search ${index + 1}`"
        @click="state.criteria.splice(index, 1)"
      />
    </div>
    <v-btn
      size="small"
      variant="outlined"
      prepend-icon="mdi-plus"
      class="mb-4"
      @click="state.criteria.push({ fieldId: null, matchType: 'contains', value: '' })"
    >
      Add field search
    </v-btn>

    <v-text-field
      v-model="state.general"
      label="General query (optional)"
      hint="Supports AND, OR, NOT and quoted phrases"
      variant="outlined"
      density="compact"
    />

    <div class="dspace__paging">
      <v-text-field
        v-model.number="state.page"
        label="Page"
        type="number"
        min="0"
        variant="outlined"
        density="compact"
        hide-details
      />
      <v-text-field
        v-model.number="state.size"
        label="Size"
        type="number"
        min="1"
        variant="outlined"
        density="compact"
        hide-details
      />
      <v-text-field
        v-model="state.sort"
        label="Sort"
        placeholder="score,DESC"
        variant="outlined"
        density="compact"
        hide-details
      />
    </div>

    <div v-if="solrQuery || state.scope" class="dspace__preview">
      <span class="dspace__preview-label">Query</span>
      <code>{{ queryString(params) }}</code>
      <span v-if="state.scope" class="dspace__preview-label"
        >Scope: {{ scopeName(state.hierarchy, state.scope) }}</span
      >
    </div>

    <v-btn color="primary" variant="flat" block prepend-icon="mdi-magnify" @click="run"
      >Search DSpace</v-btn
    >
  </div>
</template>

<style scoped>
.dspace__criterion {
  display: grid;
  grid-template-columns: 2fr 1.3fr 2fr auto;
  gap: var(--md-space-2);
  align-items: center;
  margin-block-end: var(--md-space-3);
}

.dspace__paging {
  display: grid;
  grid-template-columns: 1fr 1fr 2fr;
  gap: var(--md-space-2);
  margin-block: var(--md-space-2) var(--md-space-4);
}

.dspace__preview {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-1);
  margin-block-end: var(--md-space-4);
  padding: var(--md-space-3);
  border-radius: var(--md-radius-md);
  background: var(--md-color-bg);
  word-break: break-all;
}

.dspace__preview-label {
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

:deep(.dspace__community) {
  font-weight: var(--md-font-weight-bold);
}
</style>
