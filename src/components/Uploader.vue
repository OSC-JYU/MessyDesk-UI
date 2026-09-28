<template>

	<!-- Modal -->

    <v-dialog
      v-model="store.uploader_open"
      width="auto"
    >
      <v-card
        min-width="600"
        prepend-icon="mdi-update"
        title="Upload file"
      >
      <v-card-text>



        <v-col>

              <v-file-input
                label="Select File (image, pdf, txt, md, zip, html, json)"
                show-size
                v-model="state.uploadFile"
                accept="image/*,.pdf,text/plain,text/markdown,.md,.zip,.html,.json" 
            ></v-file-input>

            <v-alert v-if="pdfUploadBlocked" type="warning" density="compact" class="mb-2">
              PDF import is unavailable — the PDF splitter service is not running.
            </v-alert>

            <v-checkbox
              v-if="selectedFileIsPdf && !pdfUploadBlocked"
              v-model="state.deleteOriginal"
              label="Remove source PDF after import"
              density="compact"
              hide-details
            ></v-checkbox>
        </v-col>
      </v-card-text>


      <v-container v-if="state.loading" class="fill-height fluid">
        <img :src="apiUrl + 'icons/wait.gif'" />
        <v-row >
          <v-col align="center" justify="center"> <v-progress-circular
          :width="3"
          color="green"
          indeterminate
        ></v-progress-circular> Digesting...</v-col>
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

    <v-dialog
      v-model="store.set_uploader_open"
      width="auto"
    >
      <v-card
        min-width="600"
        prepend-icon="mdi-update"
        title="Upload file to Set"
      >
      <v-card-text>


        <v-col>

              <v-file-input
                label="Select Files (image, pdf, txt, html, json, md)"
                show-size
                multiple
                counter
                v-model="state.setUploadFile"
                accept="image/*,.pdf,text/plain,.html,.json,.md" 
            ></v-file-input>

            <v-alert v-if="largeUploadWarning" type="info" density="compact" class="mb-2">
              You're uploading {{ setUploadFiles.length }} files; this may take a while.
            </v-alert>

            <v-alert v-if="pdfUploadBlocked" type="warning" density="compact" class="mb-2">
              PDF import is unavailable — the PDF splitter service is not running.
            </v-alert>

            <v-checkbox
              v-if="selectedFileIsPdf && !pdfUploadBlocked"
              v-model="state.deleteOriginal"
              label="Remove source PDF after import"
              density="compact"
              hide-details
            ></v-checkbox>
        </v-col>
      </v-card-text>

      <v-container v-if="state.loading" class="fill-height fluid">
        <img :src="apiUrl + 'icons/wait.gif'" />
        <v-row >
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

      <template v-slot:actions>
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
  import { reactive, ref, computed, onMounted, watch } from "vue";
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
    deleteOriginal: true,
    uploadProgress: { completed: 0, total: 0 }
	})

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

    // Check splitter availability when dialog opens
    watch(() => store.uploader_open || store.set_uploader_open, (open) => {
      if (open) checkPdfSplitter()
    })

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
        return
      }

      if (pdfUploadBlocked.value) {
        alert('PDF import requires the PDF splitter service (md-pypdf_fs) to be running.')
        return
      }

      const uploadOptions = {}
      if (selectedFileIsPdf.value && !state.deleteOriginal) {
        uploadOptions.deleteOriginal = false
      }

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

          store.uploader_open = false
          store.set_uploader_open = false
          state.uploadFile = null
          state.setUploadFile = []
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

        store.uploader_open = false
        store.set_uploader_open = false
        state.uploadFile = null
        state.setUploadFile = []
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
