<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { uploadFile, uploadFiles } from '@/api/files.js'
import { getServices } from '@/api/services.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { useWorkspace } from '../useWorkspace.js'

// Uploads: one file onto the desk (straight from the file picker), or
// many files into a set (picker, then a confirm dialog with progress).
const workspace = useWorkspace()
const deskPicker = ref(null)
const setPicker = ref(null)

const state = reactive({
  busy: false,
  files: [],
  setOpen: false,
  progress: { completed: 0, total: 0 },
  error: null,
  splitterRunning: false,
  notice: '',
})

const isPdf = (file) =>
  file?.name?.toLowerCase().endsWith('.pdf') || file?.type === 'application/pdf'
const pdfBlocked = computed(() => state.files.some(isPdf) && !state.splitterRunning)
const set = computed(() => workspace.state.dialogs.setUpload.set)

// PDFs need the PDF splitter service to be running.
async function checkSplitter() {
  try {
    state.splitterRunning = Boolean((await getServices())?.['md-pypdf_fs']?.consumers?.length)
  } catch {
    state.splitterRunning = false
  }
}

watch(
  () => workspace.state.dialogs.upload.request,
  () => {
    checkSplitter()
    deskPicker.value?.click()
  },
)
watch(
  () => workspace.state.dialogs.setUpload.request,
  () => {
    checkSplitter()
    setPicker.value?.click()
  },
)

async function onDeskFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  await checkSplitter()
  if (isPdf(file) && !state.splitterRunning) {
    state.error =
      'Importing PDFs needs the PDF splitter service (md-pypdf_fs), which is not running.'
    return
  }
  state.busy = true
  state.error = null
  try {
    await uploadFile(file, workspace.state.deskRid, null, {})
  } catch (error) {
    state.error = error
  } finally {
    state.busy = false
  }
}

function onSetFiles(event) {
  state.files = Array.from(event.target.files || [])
  event.target.value = ''
  if (state.files.length) Object.assign(state, { setOpen: true, error: null })
}

async function uploadToSet() {
  state.busy = true
  state.error = null
  state.progress = { completed: 0, total: state.files.length }
  try {
    const result = await uploadFiles(state.files, workspace.state.deskRid, set.value.id, {
      onProgress: (progress) => (state.progress = progress),
    })
    if (result.failed?.length) {
      state.error = `${result.uploaded.length} of ${state.files.length} files uploaded. Failed: ${result.failed.map((f) => f.filename || 'unknown').join(', ')}`
    } else {
      state.notice = `${result.uploaded.length} file${result.uploaded.length === 1 ? '' : 's'} uploaded.`
      state.setOpen = false
    }
    workspace.reload()
  } catch (error) {
    state.error = error
  } finally {
    state.busy = false
  }
}
</script>

<template>
  <input
    ref="deskPicker"
    type="file"
    hidden
    accept="image/*,.pdf,text/plain,text/markdown,.md,.zip,.html,.json"
    @change="onDeskFile"
  />
  <input
    ref="setPicker"
    type="file"
    multiple
    hidden
    accept="image/*,.pdf,text/plain,.html,.json,.md"
    @change="onSetFiles"
  />

  <v-overlay
    :model-value="state.busy && !state.setOpen"
    persistent
    class="align-center justify-center"
  >
    <v-card rounded="lg" class="pa-6 text-center">
      <v-progress-circular indeterminate color="primary" class="mb-3" />
      <p class="ma-0">Uploading…</p>
    </v-card>
  </v-overlay>

  <v-dialog v-model="state.setOpen" max-width="520" :persistent="state.busy">
    <v-card rounded="lg" :title="`Add files to ${set?.data?.label || 'the set'}`">
      <v-card-text>
        <p>{{ state.files.length }} file{{ state.files.length === 1 ? '' : 's' }} selected.</p>
        <v-alert
          v-if="state.files.length >= 500"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          This many files can take a while.
        </v-alert>
        <v-alert v-if="pdfBlocked" type="warning" variant="tonal" density="compact" class="mb-2">
          Importing PDFs needs the PDF splitter service (md-pypdf_fs), which is not running.
        </v-alert>
        <template v-if="state.busy">
          <v-progress-linear
            :model-value="
              state.progress.total
                ? (state.progress.completed / state.progress.total) * 100
                : undefined
            "
            :indeterminate="!state.progress.total"
            color="primary"
            height="8"
            rounded
          />
          <p class="mt-2 mb-0">
            {{ state.progress.completed }} / {{ state.progress.total }} uploaded
          </p>
        </template>
        <ErrorAlert :error="state.error" title="Upload problem" class="mt-3" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="state.busy" @click="state.setOpen = false">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="state.busy"
          :disabled="pdfBlocked"
          @click="uploadToSet"
          >Upload</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-snackbar
    :model-value="Boolean(state.error) && !state.setOpen"
    color="error"
    timeout="6000"
    @update:model-value="state.error = null"
  >
    {{ typeof state.error === 'string' ? state.error : state.error?.message }}
  </v-snackbar>
  <v-snackbar
    :model-value="Boolean(state.notice)"
    color="success"
    timeout="3000"
    @update:model-value="state.notice = ''"
  >
    {{ state.notice }}
  </v-snackbar>
</template>
