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
                label="Select File (image, pdf, txt, html, json, md)"
                show-size
                v-model="state.setUploadFile"
                accept="image/*,.pdf,text/plain,.html,.json,.md" 
            ></v-file-input>
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
          @click="sendFile()"
        ></v-btn>
      </template>
    </v-card>
  </v-dialog>

</template>


<script setup>
  import { reactive, ref } from "vue";
	import { useRoute } from 'vue-router'
  import {store} from "./Store.js";
  import web from "../web.js";
  const apiUrl = import.meta.env.VITE_API_PATH

	const route = useRoute();
	var state = reactive({
		loading: false,
    error: '',
    uploadFile: null,
    setUploadFile: null
	})

	const props = defineProps({
        mode: ''
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

    function getSelectedFile() {
      if (store.set_uploader_open) {
        return toSingleFile(state.setUploadFile)
      }
      return toSingleFile(state.uploadFile)
    }


    async function sendFile() {
      const file = getSelectedFile()
      const projectRid = getProjectRid()

      if (!file) {
        alert('Please select a file first.')
        return
      }

      if (!projectRid) {
        alert('Project context missing. Open a project and try again.')
        return
      }

      state.loading = true
      try {
        if (store.set_uploader_open && store.current_node && store.current_node.type == 'set') {
          await web.uploadFile(file, projectRid, store.current_node.id)
        } else {
          await web.uploadFile(file, projectRid)
        }

        store.uploader_open = false
        store.set_uploader_open = false
        state.uploadFile = null
        state.setUploadFile = null
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
    state.setUploadFile = null
	}




</script>
