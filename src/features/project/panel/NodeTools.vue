<script setup>
import { computed, watch } from 'vue'
import {
  createFileThumbnail,
  createSetThumbnails,
  createSetZipJob,
  getSetZipDownloadUrl,
  getSetZipJobStatus,
} from '@/api/files.js'
import { fileUrl } from '@/features/files/fileUrls.js'
import { useWorkspace } from '../useWorkspace.js'
import { useTask } from './useTask.js'

// Actions for the selected node: open the file, remake thumbnails,
// download a set as zip, or add files to a set.
const props = defineProps({ node: { type: Object, required: true } })
const workspace = useWorkspace()

const thumbnail = useTask()
const setThumbnails = useTask()
const zip = useTask()

const type = computed(() => props.node.type)
const isSet = computed(() => type.value === 'set')
const hasThumbnail = computed(() => ['image', 'pdf'].includes(type.value))
const opensFile = computed(
  () =>
    ![
      'set',
      'process',
      'setprocess',
      'source',
      'project',
      'roi-set',
      'search-set',
      'filter',
    ].includes(type.value),
)
const setLocked = computed(() => isSet.value && Boolean(props.node.data?.processed))

// Sets of images only (not PDFs) can remake their thumbnails.
const imageSet = computed(() => {
  if (!isSet.value) return false
  const types = (props.node.data?.types || []).map((t) => String(t).toLowerCase())
  if (types.length) return types.every((t) => t === 'image')
  const paths = props.node.data?.paths || []
  return paths.length > 0 && !paths.includes('__pdf_icon__')
})

watch(
  () => props.node.id,
  () => [thumbnail, setThumbnails, zip].forEach((t) => t.reset()),
)

function remakeThumbnail() {
  thumbnail.run(() => createFileThumbnail(props.node.id), {
    start: 'Asking for a new thumbnail…',
    done: 'New thumbnail queued.',
  })
}

function remakeSetThumbnails() {
  setThumbnails.run(() => createSetThumbnails(props.node.id), {
    start: 'Asking for new thumbnails…',
    done: (r) =>
      `Queued ${Number(r?.queued || 0)} thumbnails for ${Number(r?.total_files || 0)} files.`,
  })
}

// The zip is made in the background; poll until it is ready, then download.
function downloadSet() {
  const setRid = props.node.id
  const maxWait = Number(import.meta.env.VITE_SET_ZIP_WAIT_MS || 20 * 60 * 1000)
  const every = Number(import.meta.env.VITE_SET_ZIP_POLL_MS || 2000)
  zip.run(
    async (say) => {
      const job = await createSetZipJob(setRid)
      say('Preparing the zip…')
      const started = Date.now()
      while (Date.now() - started < maxWait) {
        await new Promise((resolve) => setTimeout(resolve, every))
        const status = await getSetZipJobStatus(setRid, job.job_id)
        if (status.status === 'ready') {
          const base = String(import.meta.env.VITE_API_PATH || '')
          window.location.assign(
            base + (status.download_url || getSetZipDownloadUrl(setRid, job.job_id)),
          )
          return
        }
        if (status.status === 'failed') throw new Error(status.message || 'Making the zip failed.')
      }
      throw new Error('Making the zip takes too long. Try again later.')
    },
    { start: 'Asking for a zip of the set…', done: 'The download starts.' },
  )
}
</script>

<template>
  <div class="node-tools">
    <v-btn
      v-if="opensFile"
      :href="fileUrl(node.id)"
      target="_blank"
      size="small"
      variant="tonal"
      prepend-icon="mdi-open-in-new"
    >
      Open file
    </v-btn>

    <template v-if="hasThumbnail">
      <v-btn
        size="small"
        variant="tonal"
        prepend-icon="mdi-image-refresh"
        :loading="thumbnail.task.running"
        @click="remakeThumbnail"
      >
        Remake thumbnail
      </v-btn>
      <v-alert
        v-if="thumbnail.task.message"
        :type="thumbnail.task.type"
        variant="tonal"
        density="compact"
        >{{ thumbnail.task.message }}</v-alert
      >
    </template>

    <template v-if="isSet">
      <v-btn
        size="small"
        variant="tonal"
        prepend-icon="mdi-folder-zip-outline"
        :loading="zip.task.running"
        @click="downloadSet"
      >
        Download set
      </v-btn>
      <v-alert v-if="zip.task.message" :type="zip.task.type" variant="tonal" density="compact">{{
        zip.task.message
      }}</v-alert>
      <v-btn
        v-if="imageSet"
        size="small"
        variant="tonal"
        prepend-icon="mdi-image-refresh"
        :loading="setThumbnails.task.running"
        @click="remakeSetThumbnails"
      >
        Remake thumbnails
      </v-btn>
      <v-alert
        v-if="setThumbnails.task.message"
        :type="setThumbnails.task.type"
        variant="tonal"
        density="compact"
      >
        {{ setThumbnails.task.message }}
      </v-alert>
      <v-btn
        v-if="!setLocked"
        size="small"
        color="primary"
        variant="flat"
        prepend-icon="mdi-upload"
        @click="workspace.uploadToSet(node)"
      >
        Add files to set
      </v-btn>
      <v-alert v-else type="info" variant="tonal" density="compact">
        A cruncher has already processed this set, so no more files can be added.
      </v-alert>
    </template>
  </div>
</template>

<style scoped>
.node-tools {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}
</style>
