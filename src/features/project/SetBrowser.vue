<script setup>
import { computed, reactive, watch } from 'vue'
import { getSetFiles } from '@/api/projects.js'
import { getImageROIs } from '@/api/files.js'
import ResultsGrid from '@/features/search/ResultsGrid.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { taggedFileToResult } from '@/features/search/results.js'
import { toRid } from '@/features/files/fileTypes.js'

// The files of a set, paged from the server, shown in place of the graph.
// With an ROI set, each image says whether it has regions yet.
const props = defineProps({
  set: { type: Object, required: true }, // Vue Flow node of the set
  roiSet: { type: Object, default: null }, // Vue Flow node of an ROI set drawn on this set
  initialPage: { type: Number, default: 1 },
  refreshToken: { type: Number, default: 0 },
})

const emit = defineEmits(['open', 'close', 'upload', 'page'])

const PER_PAGE = 10
const state = reactive({
  files: [],
  total: 0,
  page: props.initialPage,
  loading: false,
  error: null,
})
const roiPresence = new Map()

const results = computed(() =>
  state.files.map((file) => ({
    ...taggedFileToResult(file),
    badge: file.has_rois ? 'Has regions' : '',
  })),
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

async function load() {
  state.loading = true
  state.error = null
  try {
    const data = await getSetFiles(props.set.id, (state.page - 1) * PER_PAGE, PER_PAGE)
    state.total = Number(data?.file_count || 0)
    state.files = await markRegions(data?.files || [])
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
}

function open(result, index) {
  emit('open', { rid: result.rid, index, total: state.total })
}

watch(
  () => state.page,
  (page) => {
    emit('page', page)
    load()
  },
)
watch(() => [props.set.id, props.roiSet?.id, props.refreshToken], load, { immediate: true })
</script>

<template>
  <div class="set-browser">
    <ErrorAlert :error="state.error" title="Could not load the set" class="ma-4" />
    <ResultsGrid
      v-model:page="state.page"
      :title="set.data?.label || 'Set'"
      :results="results"
      :total="state.total"
      :per-page="PER_PAGE"
      :loading="state.loading"
      empty-title="This set is empty"
      @open="open"
    >
      <template #actions>
        <v-spacer />
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
