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
                label="Select File (image, pdf, txt, zip)"
                show-size
                ref="upload" accept="image/*,.pdf,text/plain,.zip" 
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
                label="Select File (image, pdf, txt)"
                show-size
                ref="upload" accept="image/*,.pdf,text/plain" 
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
  import { watch, reactive, ref} from "vue";
	import { useRoute } from 'vue-router'
  import {store} from "./Store.js";
  import web from "../web.js";
  const apiUrl = import.meta.env.VITE_API_PATH

	const route = useRoute();
  const upload = ref(null);


	var state = reactive({
		loading: false,
    error: ''
	})
	var new_node = reactive({})
  var created = reactive([])

	const props = defineProps({
        mode: ''
    })


    async function sendFile() {
        if(upload.value.files.length && route.query.node) {
          state.loading = true
            try {
                if(store.set_uploader_open && store.current_node && store.current_node.type == 'set') {
                  await web.uploadFile(upload.value.files[0], route.query.node, store.current_node.id)

                } else {
                  await web.uploadFile(upload.value.files[0], route.query.node)
                }

                state.loading = false
                store.uploader_open = false
                store.set_uploader_open = false
                //store.reload()
            } catch(e) {
                if(e.response && e.response.data.error)
                    alert(e.response.data.error)
                else
                    alert(e)
            }
        }
    }

	function close() {

		store.uploader_open = false
		store.set_uploader_open = false
	}




</script>
