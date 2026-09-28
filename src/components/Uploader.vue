<template>

  <!-- Hidden native pickers: clicking "Upload" opens these directly, no intermediate step -->
  <input
    ref="singleFileInputRef"
    type="file"
    style="display: none"
    accept="image/*,.pdf,text/plain,text/markdown,.md,.zip,.html,.json"
    @change="onSingleFileChange"
  />
  <input
    ref="multiFileInputRef"
    type="file"
    multiple
    style="display: none"
    accept="image/*,.pdf,text/plain,.html,.json,.md"
    @change="onMultiFileChange"
  />

  <!-- Main-desk upload: no dialog, just a loading indicator while the single file is sent -->
  <v-overlay v-if="!store.set_uploader_open" v-model="state.loading" persistent class="align-center justify-center">
    <v-container class="fill-height fluid">
      <img :src="apiUrl + 'icons/wait.gif'" />
      <v-row>
        <v-col align="center" justify="center">
          <v-progress-circular :width="3" color="green" indeterminate></v-progress-circular> Digesting...
        </v-col>
      </v-row>
    </v-container>
  </v-overlay>

  <!-- Set upload: files are already picked via the native dialog by the time this shows;
       this is only a minimal confirm/progress step -->
  <v-dialog
    v-model="store.set_uploader_open"
    width="auto"
  >
    <v-card
      min-width="600"
      prepend-icon="mdi-update"
      title="Upload files to Set"
    >
      <v-card-text v-if="!state.loading">
        <v-col>
          <div>{{ setUploadFiles.length }} file{{ setUploadFiles.length === 1 ? '' : 's' }} selected.</div>

          <v-alert v-if="largeUploadWarning" type="info" density="compact" class="mt-2">
            You're uploading {{ setUploadFiles.length }} files; this may take a while.
          </v-alert>

          <v-alert v-if="pdfUploadBlocked" type="warning" density="compact" class="mt-2">
            PDF import is unavailable — the PDF splitter service is not running.
          </v-alert>
        </v-col>
      </v-card-text>

      <v-container v-if="state.loading" class="fill-height fluid">
        <img :src="apiUrl + 'icons/wait.gif'" />
        <v-row>
          <v-col align="center" justify="center">
            <v-progress-circular
              v-if="!state.uploadProgress.total"
              :width="3"
              color="green"
              indeterminate
            ></v-progress-circular>
            <v-progress-linear
              v-else
              :model-value="(state.uploadProgress.completed / state.uploadProgress.total) * 100"
              color="green"
              height="8"
            ></v-progress-linear>
            <div v-if="state.uploadProgress.total">{{ state.uploadProgress.completed }} / {{ state.uploadProgress.total }} uploaded</div>
            <div v-else>Digesting...</div>
          </v-col>
        </v-row>
      </v-container>

      <template v-if="!state.loading" v-slot:actions>
        <v-btn
          class="ms-auto"
          text="Cancel"
          @click="close()"
        ></v-btn>
        <v-divider thickness="0"></v-divider>
        <v-btn
          class="ms-auto primary"
          text="Upload"
          :disabled="pdfUploadBlocked"
          @click="sendFile()"
        ></v-btn>
      </template>
    </v-card>
  </v-dialog>

</template>


<script setup>
  import { reactive, ref, computed, watch } from "vue";
	import { useRoute } from 'vue-router'
  import {store} from "./Store.js";
  import web from "../web.js";
  const apiUrl = import.meta.env.VITE_API_PATH

	const route = useRoute();
	var state = reactive({
		loading: false,
    error: '',
    uploadFile: null,
    setUploadFile: [],
    pdfSplitterAvailable: false,
    uploadProgress: { completed: 0, total: 0 }
	})

  const singleFileInputRef = ref(null)
  const multiFileInputRef = ref(null)

	const props = defineProps({
        mode: ''
    })

    // Check if PDF splitter is available
    async function checkPdfSplitter() {
      try {
        const services = await web.getServices()
        const splitter = services?.['md-pypdf_fs']
        state.pdfSplitterAvailable = Boolean(splitter?.consumers?.length > 0)
      } catch {
        state.pdfSplitterAvailable = false
      }
    }

    // "uploader_open" is a one-shot trigger: open the native picker immediately, no dialog step.
    watch(() => store.uploader_open, (open) => {
      if (!open) return
      store.uploader_open = false
      checkPdfSplitter()
      singleFileInputRef.value?.click()
    })

    // "set_uploader_open" also triggers the native picker directly; it's flipped back to true
    // (to show the confirm/progress dialog) only once files have actually been chosen.
    watch(() => store.set_uploader_open, (open) => {
      if (!open) return
      if (setUploadFiles.value.length > 0) return // already showing the confirm dialog
      store.set_uploader_open = false
      checkPdfSplitter()
      multiFileInputRef.value?.click()
    })

    async function onSingleFileChange(event) {
      const file = event.target.files?.[0] || null
      event.target.value = ''
      if (!file) return
      state.uploadFile = file
      await sendFile()
    }

    function onMultiFileChange(event) {
      const files = Array.from(event.target.files || [])
      event.target.value = ''
      if (!files.length) return
      state.setUploadFile = files
      store.set_uploader_open = true
    }

    const selectedFileIsPdf = computed(() => {
      if (store.set_uploader_open) {
        return toFileArray(state.setUploadFile).some((file) => {
          return file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
        })
      }
      const file = getSelectedFile()
      if (!file) return false
      return file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'
    })

    const pdfUploadBlocked = computed(() => {
      return selectedFileIsPdf.value && !state.pdfSplitterAvailable
    })

    function getProjectRid() {
      if (route.params?.rid) return String(route.params.rid)
      if (route.query?.node) return String(route.query.node)
      if (store.current_project?.id) return String(store.current_project.id).replace('#', '')
      if (store.current_node?.project_rid) return String(store.current_node.project_rid).replace('#', '')
      return null
    }

    function toSingleFile(value) {
      if (!value) return null
      if (Array.isArray(value)) return value[0] || null
      if (typeof File !== 'undefined' && value instanceof File) return value
      return value && typeof value === 'object' ? value : null
    }

    function toFileArray(value) {
      if (!value) return []
      if (Array.isArray(value)) return value.filter(Boolean)
      return [value]
    }

    const setUploadFiles = computed(() => toFileArray(state.setUploadFile))

    const largeUploadWarning = computed(() => {
      return store.set_uploader_open && setUploadFiles.value.length >= 500
    })

    function getSelectedFile() {
      if (store.set_uploader_open) {
        return toSingleFile(state.setUploadFile)
      }
      return toSingleFile(state.uploadFile)
    }


    async function sendFile() {
      const projectRid = getProjectRid()

      if (!projectRid) {
        alert('Project context missing. Open a project and try again.')
        close()
        return
      }

      if (pdfUploadBlocked.value) {
        alert('PDF import requires the PDF splitter service (md-pypdf_fs) to be running.')
        return
      }

      const uploadOptions = {}

      if (store.set_uploader_open && store.current_node && store.current_node.type == 'set') {
        const files = setUploadFiles.value
        if (!files.length) {
          alert('Please select at least one file.')
          return
        }

        state.loading = true
        state.uploadProgress = { completed: 0, total: files.length }
        try {
          uploadOptions.onProgress = (progress) => {
            state.uploadProgress = progress
          }
          const result = await web.uploadFiles(files, projectRid, store.current_node.id, uploadOptions)

          if (result.failed?.length) {
            const failedNames = result.failed.map((f) => f.filename || 'unknown').join(', ')
            alert(`${result.uploaded.length} of ${files.length} files uploaded. Failed: ${failedNames}`)
          }

          close()
        } catch (e) {
          alert(e?.message || 'Upload failed')
        } finally {
          state.loading = false
          state.uploadProgress = { completed: 0, total: 0 }
        }
        return
      }

      const file = getSelectedFile()
      if (!file) {
        alert('Please select a file first.')
        return
      }

      state.loading = true
      try {
        await web.uploadFile(file, projectRid, null, uploadOptions)
        close()
      } catch (e) {
        alert(e?.message || 'Upload failed')
      } finally {
        state.loading = false
      }
    }

	function close() {

		store.uploader_open = false
		store.set_uploader_open = false
    state.uploadFile = null
    state.setUploadFile = []
	}




</script>
