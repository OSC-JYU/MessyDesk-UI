<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getCodingCoverage, getCodingTexts, getMyCodingSets } from '@/api/coding.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import LoadingState from '@/ui/LoadingState.vue'
import TextRoiEditor from '@/features/files/roi/TextRoiEditor.vue'
import { codingTextApi } from '@/features/files/roi/textApi.js'

// A coder's page for one ROI set: its texts on the left, the text being coded in the middle. The
// coder sees nothing of the desk beyond this set.
const route = useRoute()
const router = useRouter()
const api = codingTextApi()

const setRid = computed(() => `#${String(route.params.set).replace('#', '')}`)
const textRid = computed(() => (route.params.text ? `#${String(route.params.text).replace('#', '')}` : ''))
const state = reactive({ texts: [], coverage: {}, info: null, loading: true, error: null })

const current = computed(() => state.texts.find((t) => t.rid === textRid.value) || null)
const locked = computed(() => Boolean(state.info?.locked))

async function load() {
  state.loading = true
  state.error = null
  try {
    const [texts, sets] = await Promise.all([getCodingTexts(setRid.value), getMyCodingSets()])
    state.texts = texts || []
    state.info = (sets || []).find((s) => s.roi_set === setRid.value) || null
    state.coverage = (await getCodingCoverage(setRid.value).catch(() => null))?.files || {}
    if (!textRid.value && state.texts.length) open(state.texts[0].rid, true)
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
}

function open(rid, replace = false) {
  const to = { name: 'coding-text', params: { set: route.params.set, text: rid.replace('#', '') } }
  return replace ? router.replace(to) : router.push(to)
}

// "Next text" for the editor's buttons: after the shown text, then from the start.
async function findNext(matches) {
  const at = state.texts.findIndex((t) => t.rid === textRid.value)
  const order = [...state.texts.slice(at + 1), ...state.texts.slice(0, Math.max(at, 0))]
  const found = order.find((t) => matches(t.rid))
  if (!found) return false
  await open(found.rid)
  return true
}

const done = (rid) => (state.coverage[rid]?.regions || 0) > 0

async function refreshCoverage() {
  state.coverage = (await getCodingCoverage(setRid.value).catch(() => null))?.files || state.coverage
}

onMounted(load)
watch(setRid, load)
watch(textRid, () => !state.loading && refreshCoverage())
</script>

<template>
  <div class="coding-set">
    <LoadingState v-if="state.loading" text="Opening the set…" />
    <ErrorAlert v-else-if="state.error" :error="state.error" title="Could not open the set" />
    <template v-else>
      <aside class="coding-set__texts" aria-label="Texts">
        <router-link :to="{ name: 'coding' }" class="coding-set__back">← My sets</router-link>
        <h2 class="coding-set__title">{{ state.info?.label }}</h2>
        <p class="coding-set__meta">
          {{ Object.keys(state.coverage).length }} of {{ state.texts.length }} texts with passages
          <v-chip v-if="locked" size="x-small" label class="ms-1">Locked</v-chip>
        </p>
        <ul class="coding-set__list">
          <li v-for="text in state.texts" :key="text.rid">
            <button
              type="button"
              class="coding-set__text"
              :class="{ 'coding-set__text--current': text.rid === textRid }"
              @click="open(text.rid)"
            >
              <v-icon
                :icon="done(text.rid) ? 'mdi-check-circle-outline' : 'mdi-circle-outline'"
                size="16"
                aria-hidden="true"
              />
              {{ text.label }}
            </button>
          </li>
        </ul>
      </aside>
      <main class="coding-set__editor">
        <EmptyState
          v-if="!current"
          icon="mdi-text-box-outline"
          title="This set has no texts"
          text="Ask the owner of the desk."
        />
        <TextRoiEditor
          v-else
          :key="current.rid"
          :file="{ '@rid': current.rid, label: current.label }"
          :target="setRid"
          :api="api"
          :read-only="locked"
          :find-next="findNext"
        />
      </main>
    </template>
  </div>
</template>

<style scoped>
.coding-set {
  display: flex;
  align-items: flex-start;
  gap: var(--md-space-4);
  padding: var(--md-space-4);
}

.coding-set__texts {
  flex: 0 0 16rem;
  max-width: 28%;
}

.coding-set__editor {
  flex: 1 1 auto;
  min-width: 0;
}

.coding-set__back {
  font-size: var(--md-font-size-sm);
}

.coding-set__title {
  margin: var(--md-space-2) 0;
  font-size: var(--md-font-size-md);
}

.coding-set__meta {
  margin: 0 0 var(--md-space-3);
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-sm);
}

.coding-set__list {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.coding-set__text {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  width: 100%;
  padding: var(--md-space-1) var(--md-space-2);
  border: 0;
  border-radius: var(--md-radius-sm);
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--md-font-size-sm);
  text-align: start;
  cursor: pointer;
}

.coding-set__text:hover,
.coding-set__text--current {
  background: var(--md-color-bg);
}
</style>
