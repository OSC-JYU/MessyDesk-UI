<script setup>
import { reactive, watch } from 'vue'
import { getNerLabelMentions } from '@/api/entities.js'

// The mentions found for one NER label (e.g. the persons a model found),
// searched and paged on the server. A mention can occur in several places
// ("hits"); picking one steps through them and emits `preview` for each.
const props = defineProps({
  tag: { type: Object, required: true },
  search: { type: String, default: '' },
  deskRids: { type: Array, default: () => [] },
  fileRids: { type: Array, default: () => [] },
  showCount: { type: Boolean, default: false },
})

const emit = defineEmits(['preview', 'close-preview'])

const state = reactive({
  mentions: [],
  total: 0,
  page: 1,
  pageSize: 20,
  search: props.search,
  loaded: false,
  loading: false,
  active: null, // { text, hits, index }
})

async function load(page = 1) {
  state.loading = true
  closeActive()
  try {
    const response = await getNerLabelMentions(
      props.tag.service_id,
      props.tag.task,
      props.tag.label,
      {
        search: state.search,
        page,
        pageSize: state.pageSize,
        projectRids: props.deskRids,
        fileRids: props.fileRids,
      },
    )
    state.mentions = response?.mentions || []
    state.total = response?.total || 0
    state.page = response?.page || page
    state.loaded = true
  } finally {
    state.loading = false
  }
}

function closeActive() {
  if (state.active) emit('close-preview')
  state.active = null
}

function showHit() {
  const hit = state.active.hits[state.active.index]
  if (hit) emit('preview', { hit, mention: state.active.text })
}

function pick(mention) {
  if (state.active?.text === mention.text) {
    closeActive()
    return
  }
  state.active = { text: mention.text, hits: mention.hits || [], index: 0 }
  showHit()
}

function step(delta) {
  const next = state.active.index + delta
  if (next < 0 || next >= state.active.hits.length) return
  state.active.index = next
  showHit()
}

let timer = null
function onSearch(value) {
  state.search = value || ''
  clearTimeout(timer)
  timer = setTimeout(() => load(1), 300)
}

// The page's search box searches inside mentions too.
watch(
  () => props.search,
  (value) => {
    state.search = value
    if (state.loaded) load(1)
  },
)

defineExpose({ load })
</script>

<template>
  <v-expansion-panel @group:selected="({ value }) => value && !state.loaded && load(1)">
    <v-expansion-panel-title>
      {{ tag.label }}
      <span v-if="showCount" class="ner-label__count">({{ tag.count }})</span>
    </v-expansion-panel-title>
    <v-expansion-panel-text>
      <v-text-field
        :model-value="state.search"
        label="Search names"
        density="compact"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        class="mb-2"
        @update:model-value="onSearch"
      />
      <v-progress-linear v-if="state.loading" indeterminate class="mb-2" />
      <template v-else>
        <div class="ner-label__mentions">
          <v-chip
            v-for="mention in state.mentions"
            v-show="
              !state.active || state.active.hits.length <= 1 || state.active.text === mention.text
            "
            :key="mention.text"
            :color="state.active?.text === mention.text ? 'secondary' : undefined"
            :variant="state.active?.text === mention.text ? 'flat' : 'tonal'"
            size="small"
            @click="pick(mention)"
          >
            {{ mention.text }}
            <span v-if="mention.count > 1" class="ner-label__count">({{ mention.count }})</span>
          </v-chip>
        </div>
        <p v-if="state.loaded && !state.mentions.length" class="ner-label__empty">No matches</p>

        <div v-if="state.active" class="ner-label__active">
          <div class="ner-label__active-head">
            <strong>{{ state.active.text }}</strong>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              aria-label="Close"
              @click="closeActive"
            />
          </div>
          <div v-if="state.active.hits.length > 1" class="ner-label__stepper">
            <v-btn
              icon="mdi-chevron-left"
              size="x-small"
              variant="text"
              aria-label="Previous hit"
              :disabled="state.active.index === 0"
              @click="step(-1)"
            />
            <span>{{ state.active.index + 1 }} / {{ state.active.hits.length }}</span>
            <v-btn
              icon="mdi-chevron-right"
              size="x-small"
              variant="text"
              aria-label="Next hit"
              :disabled="state.active.index === state.active.hits.length - 1"
              @click="step(1)"
            />
          </div>
          <p class="ner-label__file">
            {{ state.active.hits[state.active.index]?.file_label }}
            <span v-if="state.active.hits[state.active.index]?.confidence != null">
              · confidence {{ state.active.hits[state.active.index].confidence }}
            </span>
          </p>
        </div>

        <v-pagination
          v-if="state.total > state.pageSize"
          :model-value="state.page"
          :length="Math.ceil(state.total / state.pageSize)"
          :total-visible="5"
          density="compact"
          @update:model-value="load"
        />
      </template>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<style scoped>
.ner-label__count {
  margin-inline-start: var(--md-space-1);
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.ner-label__mentions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
}

.ner-label__empty,
.ner-label__file {
  margin: var(--md-space-2) 0 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.ner-label__active {
  margin-block-start: var(--md-space-3);
  padding: var(--md-space-2) var(--md-space-3);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-md);
}

.ner-label__active-head,
.ner-label__stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ner-label__stepper {
  justify-content: flex-start;
  gap: var(--md-space-1);
  font-size: var(--md-font-size-xs);
}
</style>
