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
        <div v-if="store.current_node && store.current_node.type == 'set'">Upload to set</div>

        <v-col>

              <v-file-input
                label="Select File (image, pdf, text)"
                show-size
                ref="upload" accept="image/*,.pdf,text/*" 
            ></v-file-input>
        </v-col>
      </v-card-text>
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

	const route = useRoute();
    const upload = ref(null);


	var state = reactive({
		error: ''
	})
	var new_node = reactive({})
    var created = reactive([])

	const props = defineProps({
        mode: ''
    })


    async function sendFile() {
        if(upload.value.files.length && route.query.node) {
            try {
                if(store.current_node && store.current_node.type == 'set')
                    await web.uploadFile(upload.value.files[0], route.query.node, store.current_node.id)
                else
                    await web.uploadFile(upload.value.files[0], route.query.node)
                store.uploader_open = false
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
	}




</script>
