<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { toRid } from '../fileTypes.js'
import { asText } from '../useFileContent.js'
import { ownerTextApi } from './textApi.js'
import { useTextRois } from './useTextRois.js'
import { useCodebook } from './useCodebook.js'
import { codePointIndex, segmentsOf, selectionOffsets } from './textRegions.js'
import { tagColor } from './tagColors.js'
import TextRoiTagPicker from './TextRoiTagPicker.vue'

// Mark passages of a text as regions of interest, for one ROI set, and optionally tag them.
// Selecting text makes a region and saves it; a small popup offers the tags of the desk, and can be
// ignored. A region without tags is a plain marked passage. Keys 1-9 tag the selected passage with
// the first nine tags of the codebook.
const props = defineProps({
  file: { type: Object, required: true },
  target: { type: [Object, String], required: true }, // the ROI set (node or rid)
  deskRid: { type: String, default: '' },
  // (matches) => Promise<boolean>: goes to the next text of the set that matches; set by the viewer
  findNext: { type: Function, default: null },
  // Where to read and write: the owner's routes (default) or a coder's (see textApi.js)
  api: { type: Object, default: () => ownerTextApi },
  // A locked set can be read, not changed
  readOnly: { type: Boolean, default: false },
})

const setRid = computed(() => toRid(props.target?.id || props.target?.['@rid'] || props.target))
const desk = computed(() => props.deskRid || props.file?.project_rid || '')
const content = reactive({ state: { content: null, loading: false, error: null } })
let contentToken = 0
async function loadContent() {
  const rid = props.file?.['@rid']
  if (!rid) return
  const mine = ++contentToken
  content.state.loading = true
  content.state.error = null
  try {
    const value = await props.api.content(rid, setRid.value)
    if (mine === contentToken) content.state.content = value
  } catch (error) {
    if (mine === contentToken) content.state.error = error
  } finally {
    if (mine === contentToken) content.state.loading = false
  }
}
watch(() => [props.file?.['@rid'], setRid.value], loadContent, { immediate: true })
const text = computed(() => asText(content.state.content))
const rois = useTextRois(
  () => props.file?.['@rid'],
  () => setRid.value,
  props.api,
)
const codebook = useCodebook(
  () => desk.value,
  () => setRid.value,
  props.api,
)

const root = ref(null)
const selectedId = ref(null)
const picker = ref(null) // { regionId, position }
const onlyUntagged = ref(false)
// Spans found by named-entity recognition on this text, offered as passages.
const imp = reactive({ open: false, runs: [], loading: false, message: '' })
async function openImport() {
  imp.open = !imp.open
  if (!imp.open) return
  imp.message = ''
  imp.loading = true
  imp.runs = await rois.nerRuns()
  imp.loading = false
  if (!imp.runs.length) imp.message = 'No named-entity results on this text.'
}
async function runImport(run) {
  const result = await rois.importRun(run.rid)
  if (!result) return
  imp.open = false
  notice.value = `Imported ${result.regions} passages with ${result.tags} tags${
    result.skipped ? ` (${result.skipped} skipped)` : ''
  }.`
}
const adjustingId = ref(null) // the next selection becomes the edges of this passage

// Which texts of the set have passages (and untagged ones), for the "next text" buttons.
const coverage = ref({})
const notice = ref('')
async function loadCoverage() {
  try {
    coverage.value = (await props.api.coverage(setRid.value))?.files || {}
  } catch {
    coverage.value = {}
  }
}
async function goNext(kind) {
  notice.value = ''
  await loadCoverage()
  const own = props.file?.['@rid']
  const matches = (rid) =>
    kind === 'empty' ? !coverage.value[rid] : (coverage.value[rid]?.untagged || 0) > 0
  // The shown text counts as it is now, not as it was when the coverage was read.
  const found = await props.findNext?.((rid) => rid !== own && matches(rid))
  if (found === false) {
    notice.value = kind === 'empty' ? 'Every text has passages.' : 'No other text has untagged passages.'
  }
}
const withPassages = computed(() => Object.keys(coverage.value).length)

const regions = computed(() => rois.state.regions)
const tagsOf = (id) => rois.state.tags[id] || []
const segments = computed(() => segmentsOf(text.value, regions.value))
const index = computed(() => codePointIndex(text.value))
const shownRegions = computed(() =>
  onlyUntagged.value ? regions.value.filter((r) => !tagsOf(r.id).length) : regions.value,
)
const untaggedCount = computed(() => regions.value.filter((r) => !tagsOf(r.id).length).length)
const counts = computed(() => {
  const out = {}
  for (const region of regions.value) {
    for (const t of tagsOf(region.id)) out[t.rid] = (out[t.rid] || 0) + 1
  }
  return out
})

const excerpt = (region) => {
  const snippet = text.value.slice(index.value[region.start], index.value[region.end])
  return snippet.length > 160 ? `${snippet.slice(0, 159)}…` : snippet
}

// The tags of a segment: those of every region covering it, each once.
function segmentTags(segment) {
  const seen = new Map()
  for (const id of segment.ids) for (const t of tagsOf(id)) seen.set(t.rid, t)
  return [...seen.values()]
}

// Tagged text takes the colour of its tag (stacked underlines for several tags); a passage
// without tags is amber. Colour is not the only cue: the tags are named in the side list.
function segmentStyle(segment) {
  if (!segment.ids.length) return null
  const tags = segmentTags(segment)
  if (!tags.length) return { backgroundColor: 'rgba(255, 193, 7, 0.3)' }
  const colors = tags.map(tagColor)
  return {
    backgroundColor: `color-mix(in srgb, ${colors[0]} 25%, transparent)`,
    boxShadow: colors.map((c, i) => `inset 0 -${(i + 1) * 3}px 0 ${c}`).join(', '),
  }
}

const segmentClass = (segment) => ({
  'text-roi__mark': segment.ids.length > 0,
  'text-roi__mark--selected': selectedId.value && segment.ids.includes(selectedId.value),
})

function pickerPosition(rect) {
  const width = 256
  return {
    top: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 280)),
    left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
  }
}

async function onMouseUp() {
  if (props.readOnly) return
  const range = selectionOffsets(root.value, text.value)
  if (!range) return
  if (adjustingId.value) {
    const id = adjustingId.value
    adjustingId.value = null
    window.getSelection().removeAllRanges()
    selectedId.value = id
    await rois.setRange(id, range.start, range.end)
    return
  }
  const rect = window.getSelection().getRangeAt(0).getBoundingClientRect()
  window.getSelection().removeAllRanges()
  const region = await rois.add(range.start, range.end)
  selectedId.value = region.id
  picker.value = { regionId: region.id, position: pickerPosition(rect) }
}

// A click on a marked passage (no selection) selects the innermost region there.
function onClick(event) {
  const ids = event.target?.dataset?.ids
  if (!ids || !window.getSelection()?.isCollapsed) return
  const list = ids.split(' ')
  selectedId.value = list[list.length - 1]
}

function openPicker(regionId, event) {
  if (props.readOnly) return
  selectedId.value = regionId
  picker.value = { regionId, position: pickerPosition(event.currentTarget.getBoundingClientRect()) }
}

async function pick(tag) {
  const id = picker.value?.regionId
  picker.value = null
  if (id) await rois.tag(id, tag)
}

async function createAndPick(label) {
  const id = picker.value?.regionId
  picker.value = null
  try {
    const tag = await codebook.create(label)
    if (id) await rois.tag(id, tag)
  } catch (error) {
    rois.state.error = error
  }
}

async function toggleTag(regionId, tag) {
  if (props.readOnly) return
  if (tagsOf(regionId).some((t) => t.rid === tag.rid)) await rois.untag(regionId, tag.rid)
  else await rois.tag(regionId, tag)
}

async function remove(id) {
  if (props.readOnly) return
  if (adjustingId.value === id) adjustingId.value = null
  if (selectedId.value === id) selectedId.value = null
  if (picker.value?.regionId === id) picker.value = null
  await rois.remove(id)
}

// Keys 1-9: the numbered tags of the codebook, on the selected passage.
function onKeydown(event) {
  if (props.readOnly) return
  // Escape closes the tag popup wherever the focus is (it only reaches the popup's own handler
  // while the search field has the focus), then a pending change of extent.
  if (event.key === 'Escape') {
    if (picker.value) picker.value = null
    else adjustingId.value = null
    return
  }
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (/^(input|textarea|select)$/i.test(event.target?.tagName || '')) return
  if (!/^[1-9]$/.test(event.key) || !selectedId.value) return
  const tag = codebook.state.tags[Number(event.key) - 1]
  if (!tag) return
  event.preventDefault()
  toggleTag(selectedId.value, tag)
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  loadCoverage()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

// The shown text's own numbers follow its edits.
watch(
  () => [regions.value.length, untaggedCount.value],
  () => {
    if (rois.state.loading) return
    const own = props.file?.['@rid']
    const total = regions.value.length
    const next = { ...coverage.value }
    if (total) next[own] = { regions: total, tagged: total - untaggedCount.value, untagged: untaggedCount.value }
    else delete next[own]
    coverage.value = next
  },
)
</script>

<template>
  <div class="text-roi">
    <LoadingState v-if="content.state.loading || rois.state.loading" text="Opening the text…" />
    <ErrorAlert v-else-if="content.state.error" :error="content.state.error" />
    <template v-else>
      <main class="text-roi__text">
        <v-alert v-if="rois.state.stale" type="warning" variant="tonal" density="compact" class="mb-3">
          This text has changed since the passages were marked. They may not be in the right place.
        </v-alert>
        <ErrorAlert v-if="rois.state.error" :error="rois.state.error" class="mb-3" />
        <p v-if="readOnly" class="text-roi__hint" role="status">
          This set is locked: you can read it, but not change it.
        </p>
        <p v-else-if="adjustingId" class="text-roi__hint text-roi__hint--adjust" role="status">
          Select the new text for the passage. Escape cancels.
        </p>
        <p v-else class="text-roi__hint">
          Select text to mark a passage. Tagging is optional; keys 1-9 tag the selected passage.
        </p>
        <!-- The element holds exactly the text: selection offsets are measured in it, so no
             whitespace may be added between the segments. -->
        <!-- prettier-ignore -->
        <pre ref="root" class="text-roi__pre" @mouseup="onMouseUp" @click="onClick"><template v-for="segment in segments" :key="segment.start"><span :class="segmentClass(segment)" :style="segmentStyle(segment)" :data-ids="segment.ids.join(' ')">{{ segment.text }}</span></template></pre>
      </main>
      <aside class="text-roi__side" aria-label="Tags and marked passages">
        <section v-if="codebook.state.tags.length" aria-label="Tags">
          <h3 class="text-roi__title">Tags</h3>
          <ul class="text-roi__legend">
            <li v-for="(tag, i) in codebook.state.tags" :key="tag.rid">
              <button
                type="button"
                class="text-roi__legend-item"
                :disabled="!selectedId || readOnly"
                :title="selectedId ? 'Tag or untag the selected passage' : 'Select a passage first'"
                @click="selectedId && toggleTag(selectedId, tag)"
              >
                <span class="text-roi__key">{{ i < 9 ? i + 1 : '' }}</span>
                <span class="text-roi__dot" :style="{ backgroundColor: tagColor(tag) }" />
                <span class="text-roi__legend-label">{{ tag.label }}</span>
                <span class="text-roi__count">{{ counts[tag.rid] || 0 }}</span>
              </button>
            </li>
          </ul>
        </section>
        <section v-if="findNext" class="text-roi__nav" aria-label="Move between texts">
          <p class="text-roi__count-line">Texts with passages: {{ withPassages }}</p>
          <v-btn size="small" variant="tonal" block @click="goNext('empty')">
            Next text without passages
          </v-btn>
          <v-btn size="small" variant="tonal" block class="mt-1" @click="goNext('untagged')">
            Next text with untagged passages
          </v-btn>
        </section>
        <section v-if="api.canImport && !readOnly" class="text-roi__import" aria-label="Import from named entities">
          <v-btn size="small" variant="text" prepend-icon="mdi-auto-fix" @click="openImport">
            Import from named entities
          </v-btn>
          <p v-if="notice && !imp.open" class="text-roi__empty" role="status">{{ notice }}</p>
          <div v-if="imp.open" class="text-roi__import-box">
            <v-progress-linear v-if="imp.loading" indeterminate />
            <p v-if="imp.message" class="text-roi__empty">{{ imp.message }}</p>
            <button
              v-for="run in imp.runs"
              :key="run.rid"
              type="button"
              class="text-roi__run"
              @click="runImport(run)"
            >
              {{ run.service }} · {{ run.task }}
              <span class="text-roi__empty">
                {{ Object.entries(run.labels).map(([l, n]) => `${l} (${n})`).join(', ') }}
              </span>
            </button>
          </div>
        </section>
        <h3 class="text-roi__title">Passages ({{ regions.length }})</h3>
        <v-checkbox
          v-if="regions.length"
          v-model="onlyUntagged"
          density="compact"
          hide-details
          :label="`Only without tags (${untaggedCount})`"
        />
        <p v-if="!regions.length" class="text-roi__empty">No passages marked yet.</p>
        <ul class="text-roi__list">
          <li
            v-for="region in shownRegions"
            :key="region.id"
            class="text-roi__item"
            :class="{ 'text-roi__item--selected': region.id === selectedId }"
          >
            <div class="text-roi__item-main">
              <button type="button" class="text-roi__excerpt" @click="selectedId = region.id">
                {{ excerpt(region) }}
              </button>
              <div class="text-roi__chips">
                <span v-for="tag in tagsOf(region.id)" :key="tag.rid" class="text-roi__chip">
                  <span class="text-roi__dot" :style="{ backgroundColor: tagColor(tag) }" />
                  {{ tag.label }}
                  <button
                    v-if="!readOnly"
                    type="button"
                    class="text-roi__chip-x"
                    :aria-label="`Remove tag ${tag.label}`"
                    @click="rois.untag(region.id, tag.rid)"
                  >
                    ×
                  </button>
                </span>
                <button
                  v-if="!readOnly"
                  type="button"
                  class="text-roi__add"
                  @click="openPicker(region.id, $event)"
                >
                  + tag
                </button>
              </div>
            </div>
            <v-btn
              v-if="!readOnly"
              icon="mdi-arrow-expand-horizontal"
              size="x-small"
              variant="text"
              :color="adjustingId === region.id ? 'primary' : undefined"
              aria-label="Change the extent of the passage"
              :disabled="rois.state.saving"
              @click="adjustingId = adjustingId === region.id ? null : region.id"
            />
            <v-btn
              v-if="!readOnly"
              icon="mdi-delete-outline"
              size="x-small"
              variant="text"
              aria-label="Remove passage"
              :disabled="rois.state.saving"
              @click="remove(region.id)"
            />
          </li>
        </ul>
      </aside>
      <TextRoiTagPicker
        v-if="picker"
        :tags="codebook.state.tags"
        :applied="tagsOf(picker.regionId)"
        :can-create="api.canCreateTags"
        :position="picker.position"
        @pick="pick"
        @create="createAndPick"
        @close="picker = null"
      />
    </template>
  </div>
</template>

<style scoped>
.text-roi {
  display: flex;
  gap: var(--md-space-4);
  align-items: flex-start;
  padding: var(--md-space-4);
}

.text-roi__text {
  flex: 1 1 auto;
  min-width: 0;
}

.text-roi__hint,
.text-roi__empty {
  margin: 0 0 var(--md-space-2);
  font-size: var(--md-font-size-sm);
  color: var(--md-color-text-muted);
}

.text-roi__hint--adjust {
  color: var(--md-color-primary);
}

.text-roi__pre {
  margin: 0;
  max-width: 90ch;
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-sm);
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--md-color-text);
}

.text-roi__mark {
  cursor: pointer;
}

.text-roi__mark--selected {
  outline: 2px solid var(--md-color-primary, currentColor);
}

.text-roi__side {
  flex: 0 0 20rem;
  max-width: 34%;
}

.text-roi__import-box {
  display: grid;
  gap: var(--md-space-1);
  margin-block: var(--md-space-1) var(--md-space-3);
}

.text-roi__run {
  display: grid;
  padding: var(--md-space-1) var(--md-space-2);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-sm);
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--md-font-size-sm);
  text-align: start;
  cursor: pointer;
}

.text-roi__nav {
  margin-block-end: var(--md-space-3);
}

.text-roi__count-line {
  margin: 0 0 var(--md-space-2);
  font-size: var(--md-font-size-sm);
}

.text-roi__title {
  margin: var(--md-space-3) 0 var(--md-space-2);
  font-size: var(--md-font-size-sm);
  font-weight: 600;
}

.text-roi__title:first-child {
  margin-block-start: 0;
}

.text-roi__legend,
.text-roi__list {
  display: grid;
  gap: var(--md-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.text-roi__legend-item {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  width: 100%;
  padding: 2px var(--md-space-1);
  border: 0;
  border-radius: var(--md-radius-sm);
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--md-font-size-sm);
  text-align: start;
  cursor: pointer;
}

.text-roi__legend-item:disabled {
  cursor: default;
}

.text-roi__legend-item:not(:disabled):hover {
  background: var(--md-color-bg);
}

.text-roi__key {
  flex: 0 0 1ch;
  color: var(--md-color-text-muted);
}

.text-roi__legend-label {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-roi__count {
  color: var(--md-color-text-muted);
}

.text-roi__dot {
  display: inline-block;
  flex: 0 0 0.8rem;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
}

.text-roi__item {
  display: flex;
  align-items: flex-start;
  gap: var(--md-space-1);
  padding: var(--md-space-1);
  border-radius: var(--md-radius-sm);
}

.text-roi__item--selected {
  background: var(--md-color-bg);
}

.text-roi__item-main {
  flex: 1 1 auto;
  min-width: 0;
}

.text-roi__excerpt {
  display: block;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-size: var(--md-font-size-sm);
  text-align: start;
  cursor: pointer;
  word-break: break-word;
}

.text-roi__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
  margin-block-start: var(--md-space-1);
}

.text-roi__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  border: 1px solid var(--md-color-border, rgba(0, 0, 0, 0.2));
  border-radius: 999px;
  font-size: var(--md-font-size-xs);
}

.text-roi__chip-x,
.text-roi__add {
  padding: 0 2px;
  border: 0;
  background: none;
  color: var(--md-color-text-muted);
  font: inherit;
  font-size: var(--md-font-size-xs);
  cursor: pointer;
}
</style>
