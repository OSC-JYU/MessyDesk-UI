<script setup>
import { computed, reactive, watch } from 'vue'
import { settings } from '@/stores/settings.js'
import { getSetFiles } from '@/api/projects.js'
import { getImageROIs } from '@/api/files.js'
import ResultsGrid from '@/features/search/ResultsGrid.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import BreadcrumbTrail from '@/ui/BreadcrumbTrail.vue'
import { taggedFileToResult } from '@/features/search/results.js'
import { toRid } from '@/features/files/fileTypes.js'
import { versioned } from '@/features/project/nodes/thumbnails.js'

// The files of a set, paged from the server, shown in place of the graph.
// With an ROI set, each image says whether it has regions yet.
const props = defineProps({
  set: { type: Object, required: true }, // Vue Flow node of the set
  roiSet: { type: Object, default: null }, // Vue Flow node of an ROI set drawn on this set
  initialPage: { type: Number, default: 1 },
  refreshToken: { type: Number, default: 0 },
  // The PDF whose files are shown when the set opens (coming back from the file viewer)
  initialOrigin: { type: String, default: '' },
})

const emit = defineEmits(['open', 'close', 'upload', 'page'])

const PER_PAGE = 10
// The set is browsed by original PDF (a card per PDF, then its files) when the user's setting
// says so, unless this view switched it off or on. `origin` is the PDF whose files are shown.
const state = reactive({
  files: [],
  entries: null, // the top level of a grouped set: PDF cards, then files without a PDF
  groupable: false, // the set holds files from PDFs, so grouping can be switched
  override: null, // 'on' | 'off': this view's choice instead of the setting
  origin: props.initialOrigin ? { rid: props.initialOrigin, label: '' } : null,
  offsets: { origin: 0, files: 0, groups: 0 }, // positions in the whole set, for the file viewer
  total: 0, // entries (or files) to page through
  setTotal: 0, // files in the whole set
  countText: '',
  topPage: props.initialOrigin ? props.initialPage : 1,
  page: props.initialOrigin ? 1 : props.initialPage,
  loading: false,
  error: null,
})
const roiPresence = new Map()

const crumbs = computed(() => {
  const items = [{ key: 'set', label: props.set.data?.label || 'Set' }]
  if (state.origin) {
    items.push({
      key: 'origin',
      label: state.origin.label,
      icon: 'mdi-file-pdf-box',
      color: 'error',
    })
  }
  return items
})

const grouping = computed(() => (state.override ?? settings.group_pdf) === 'on')

function fileResult(file) {
  const result = taggedFileToResult(file)
  return {
    ...result,
    thumb: versioned(result.thumb, props.refreshToken || ''),
    badge: file.has_rois ? 'Has regions' : '',
    origin_rid: file.origin_rid || '',
  }
}

// A PDF card shows its first page (a file, text or image) under the PDF's name.
function groupResult(entry) {
  const cover = entry.cover ? fileResult(entry.cover) : { type: 'pdf', entities: [], text: '' }
  return {
    ...cover,
    rid: entry.origin_rid,
    label: entry.origin_label || cover.label,
    entities: [],
    group: { rid: entry.origin_rid, label: entry.origin_label },
    badge: `${entry.count} ${entry.count === 1 ? 'file' : 'files'}`,
  }
}

const results = computed(() =>
  state.entries
    ? state.entries.map((entry) =>
        entry.kind === 'group' ? groupResult(entry) : fileResult(entry),
      )
    : state.files.map(fileResult),
)

function hasRegions(payload) {
  if (!payload) return false
  if (Array.isArray(payload)) return payload.length > 0
  if (payload.rois && typeof payload.rois === 'object') return Object.keys(payload.rois).length > 0
  return Object.keys(payload).some((key) => !['@rid', 'rid', 'roi_rid'].includes(key))
}

async function markRegions(files) {
  const roiRid = toRid(props.roiSet?.id)
  if (!roiRid) return files
  return Promise.all(
    files.map(async (file) => {
      const key = `${roiRid}|${file['@rid']}`
      if (!roiPresence.has(key)) {
        roiPresence.set(key, hasRegions(await getImageROIs(file['@rid'], roiRid).catch(() => null)))
      }
      return { ...file, has_rois: roiPresence.get(key) }
    }),
  )
}

// `quiet` reloads in place (no spinner, files stay on screen) for thumbnail updates that arrive
// while the set is being browsed.
async function load({ quiet = false } = {}) {
  if (!quiet) state.loading = true
  state.error = null
  try {
    const skip = (state.page - 1) * PER_PAGE
    // Always in the grouped order, which is the order the file viewer steps in.
    const options = grouping.value
      ? { group: 'origin', origin: state.origin?.rid }
      : { group: 'origin', order: 'flat' }
    const data = await getSetFiles(props.set.id, skip, PER_PAGE, options)
    if (options.origin && !data?.origin) {
      // The PDF is not in this set (any more): back to the top level.
      state.origin = null
      state.page = state.topPage
      return load()
    }
    state.groupable = Boolean(data?.grouped)
    state.setTotal = Number(data?.set_total ?? data?.file_count ?? 0)
    state.countText = ''
    if (data?.entries) {
      const ungrouped = Number(data.entries_total) - Number(data.groups_total)
      state.total = Number(data.entries_total || 0)
      state.entries = data.entries
      state.files = []
      state.offsets = {
        origin: 0,
        files: Number(data.files_offset || 0),
        groups: Number(data.groups_total || 0),
      }
      state.countText = `${data.groups_total} PDFs${ungrouped ? ` and ${ungrouped} files` : ''}`
    } else {
      state.entries = null
      state.total = Number(data?.file_count || 0)
      state.files = await markRegions(data?.files || [])
      state.offsets.origin = Number(data?.offset || 0)
      if (data?.origin) state.origin = data.origin
      else state.origin = null
    }
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
}

// Where a file is in the whole set, in the order the file viewer steps in.
function positionOf(index) {
  if (state.entries) return state.offsets.files + index - state.offsets.groups
  return state.offsets.origin + index
}

function enter(origin) {
  const samePage = state.page === 1
  state.topPage = state.page
  state.origin = origin
  state.entries = null
  state.files = []
  state.page = 1
  if (samePage) load()
}

function leave() {
  const samePage = state.page === state.topPage
  state.origin = null
  state.page = state.topPage
  if (samePage) load()
}

function toggleGrouping() {
  state.override = grouping.value ? 'off' : 'on'
  state.origin = null
  state.topPage = 1
  if (state.page === 1) load()
  else state.page = 1
}

function open(result, index) {
  if (result.group) return enter(result.group)
  emit('open', {
    rid: result.rid,
    index: positionOf(index),
    total: state.setTotal,
    origin: result.origin_rid || '',
  })
}

watch(
  () => state.page,
  (page) => {
    if (!state.origin) emit('page', page)
    load()
  },
)
watch(
  () => [props.set.id, props.roiSet?.id],
  () => load(),
  { immediate: true },
)
watch(
  () => props.refreshToken,
  () => load({ quiet: true }),
)
</script>

<template>
  <div class="set-browser">
    <ErrorAlert :error="state.error" title="Could not load the set" class="ma-4" />
    <ResultsGrid
      v-model:page="state.page"
      :title="set.data?.label || 'Set'"
      :count-text="state.countText"
      :results="results"
      :total="state.total"
      :per-page="PER_PAGE"
      :loading="state.loading"
      empty-title="This set is empty"
      @open="open"
    >
      <template #title>
        <BreadcrumbTrail :items="crumbs" label="Where you are in the set" @select="leave" />
      </template>
      <template #actions>
        <v-spacer />
        <v-btn
          v-if="state.groupable"
          size="small"
          variant="text"
          :prepend-icon="grouping ? 'mdi-view-grid-outline' : 'mdi-file-multiple-outline'"
          @click="toggleGrouping"
        >
          {{ grouping ? 'Show all files' : 'Group by PDF' }}
        </v-btn>
        <v-btn
          v-if="!set.data?.processed"
          size="small"
          variant="text"
          prepend-icon="mdi-upload"
          @click="emit('upload')"
        >
          Add files
        </v-btn>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          aria-label="Close set"
          @click="emit('close')"
        />
      </template>
    </ResultsGrid>
  </div>
</template>

<style scoped>
.set-browser {
  height: 100%;
  background: var(--md-color-bg);
}
</style>
