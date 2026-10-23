<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { getDocInfo, getNodeFile } from '@/api/files.js'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { toRid } from '../fileTypes.js'
import {
  docIndexOf,
  docRids,
  documentCoverage,
  matchStartToken,
  queryCoverage,
  similarityLevel,
  tokenize,
  tokenizeWithOffsets,
} from '../similarity.js'

// Text similarity: the original document, the query text and the list of
// matching chunks. Picking a match (in the list or on a highlighted word)
// loads its document and scrolls both texts to it. Shows a similarity.json
// file, or `data` of the same shape (an index search, IndexDisplay).
const props = defineProps({
  file: { type: Object, default: null },
  data: { type: Object, default: null },
})

const state = reactive({
  data: null,
  loading: true,
  error: null,
  docs: {}, // docIndex → { text, tokens, offsets, label }
  docIndex: null,
  docLoading: false,
  active: -1,
})

const originalEl = ref(null)
const queryEl = ref(null)
const matches = computed(() => state.data?.chunk_similarities || [])
const queryTokens = computed(() => tokenize(state.data?.query_text))
const queryMap = computed(() => queryCoverage(state.data))
const doc = computed(() => (state.docIndex === null ? null : state.docs[state.docIndex]))
const docMap = computed(() =>
  doc.value ? documentCoverage(state.data, state.docIndex, doc.value) : new Map(),
)

function tokenClass(map, index) {
  const covering = map.get(index)
  if (!covering) return 'sim__token'
  const level = similarityLevel(matches.value[covering[0]]?.similarity || 0)
  return [
    'sim__token',
    `sim__token--${level}`,
    { 'sim__token--active': covering.includes(state.active) },
  ]
}

async function loadDoc(index) {
  if (state.docs[index]) {
    state.docIndex = index
    return
  }
  const rid = toRid(docRids(state.data)[index])
  if (!rid) return
  state.docLoading = true
  try {
    const content = await getNodeFile(rid)
    const text = typeof content === 'string' ? content : String(content)
    const info = await getDocInfo(rid).catch(() => null)
    state.docs[index] = { text, ...tokenizeWithOffsets(text), label: info?.label || '' }
    state.docIndex = index
  } finally {
    state.docLoading = false
  }
}

function scrollTo(container, index) {
  const el = container?.querySelector(`[data-token="${index}"]`)
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function pick(matchIndex) {
  const match = matches.value[matchIndex]
  if (!match) return
  state.active = matchIndex
  if (state.docIndex !== docIndexOf(match)) await loadDoc(docIndexOf(match))
  await nextTick()
  scrollTo(originalEl.value, matchStartToken(match, doc.value))
  scrollTo(queryEl.value, match.query_start_token)
}

function pickToken(map, index) {
  const covering = map.get(index)
  if (covering) pick(covering[0])
}

watch(
  () => props.data ?? props.file?.['@rid'],
  async (source) => {
    Object.assign(state, {
      data: null,
      loading: true,
      error: null,
      docs: {},
      docIndex: null,
      active: -1,
    })
    try {
      const raw = props.data ?? (await getNodeFile(source))
      state.data = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!state.data?.doc_map && state.data?.text_file) await loadDoc(0)
    } catch (error) {
      state.error = error
    } finally {
      state.loading = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <LoadingState v-if="state.loading" />
  <ErrorAlert
    v-else-if="state.error"
    :error="state.error"
    title="Could not load the similarity results"
  />
  <div v-else class="sim">
    <section class="sim__column">
      <h3 class="sim__heading">
        Original text
        <v-chip v-if="doc" size="small" variant="outlined" color="primary" label>
          Doc {{ state.docIndex }}{{ doc.label ? `: ${doc.label}` : '' }}
        </v-chip>
        <v-progress-circular v-if="state.docLoading" indeterminate size="16" width="2" />
      </h3>
      <p v-if="!doc" class="sim__muted">Pick a match to load its original text.</p>
      <p v-else ref="originalEl" class="sim__text">
        <span
          v-for="(token, index) in doc.tokens"
          :key="index"
          :data-token="index"
          :class="tokenClass(docMap, index)"
          @click="pickToken(docMap, index)"
          >{{ token }}
        </span>
      </p>
    </section>

    <section class="sim__column">
      <h3 class="sim__heading">Query text</h3>
      <p ref="queryEl" class="sim__text">
        <span
          v-for="(token, index) in queryTokens"
          :key="index"
          :data-token="index"
          :class="tokenClass(queryMap, index)"
          @click="pickToken(queryMap, index)"
          >{{ token }}
        </span>
      </p>
    </section>

    <aside class="sim__column sim__column--stats">
      <h3 class="sim__heading">Matches</h3>
      <dl class="sim__stats">
        <dt>Matches</dt>
        <dd>{{ state.data.chunk_count }}</dd>
        <template v-if="state.data.query_windows > 1">
          <dt>Query passages</dt>
          <dd>{{ state.data.query_windows }}</dd>
        </template>
        <template v-if="state.data.threshold">
          <dt>Smallest match</dt>
          <dd>{{ (state.data.threshold * 100).toFixed(0) }}%</dd>
        </template>
        <dt>Best similarity</dt>
        <dd>{{ ((state.data.max_similarity || 0) * 100).toFixed(2) }}%</dd>
        <dt>Window</dt>
        <dd>{{ state.data.window_size }} tokens</dd>
        <dt>Overlap</dt>
        <dd>{{ state.data.overlap }} tokens</dd>
      </dl>
      <v-list density="compact" class="sim__list">
        <v-list-item
          v-for="(match, index) in matches"
          :key="index"
          :active="state.active === index"
          color="primary"
          :title="`Match ${index + 1} (${(match.similarity * 100).toFixed(1)}%)`"
          :subtitle="`${match.doc_label || `Doc ${docIndexOf(match)}`}, char ${match.text_start_char ?? '–'} · query token ${match.query_start_token}`"
          @click="pick(index)"
        />
      </v-list>
    </aside>
  </div>
</template>

<style scoped>
.sim {
  display: grid;
  grid-template-columns: 4fr 5fr 3fr;
  height: 100%;
}

.sim__column {
  min-height: 0;
  overflow-y: auto;
  padding: var(--md-space-4);
  border-inline-end: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.sim__column--stats {
  border: 0;
}

.sim__heading {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  margin: 0 0 var(--md-space-3);
  font-size: var(--md-font-size-lg);
}

.sim__text {
  margin: 0;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.sim__token {
  border-radius: var(--md-radius-sm);
  cursor: default;
}

.sim__token--high,
.sim__token--medium,
.sim__token--low {
  cursor: pointer;
  border-bottom: 2px solid var(--level);
  background: color-mix(in srgb, var(--level) 18%, transparent);
}

.sim__token--high {
  --level: var(--md-color-success);
}

.sim__token--medium {
  --level: var(--md-color-warning);
}

.sim__token--low {
  --level: var(--md-color-error);
}

.sim__token--active {
  --level: var(--md-color-primary);
  background: color-mix(in srgb, var(--md-color-primary) 30%, transparent);
}

.sim__stats {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--md-space-1) var(--md-space-3);
  margin: 0 0 var(--md-space-3);
}

.sim__stats dt {
  color: var(--md-color-text-muted);
}

.sim__stats dd {
  margin: 0;
  font-weight: var(--md-font-weight-medium);
}

.sim__muted {
  color: var(--md-color-text-muted);
}
</style>
