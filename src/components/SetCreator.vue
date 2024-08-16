<template>

	<!-- Modal -->

    <v-dialog
      v-model="store.set_creator_open"
      width="auto"
    >
      <v-card
        min-width="600"
        prepend-icon="mdi-folder"
        title="Create Set"
      >
      <v-card-text>

        <v-col>
          <v-text-field v-model="state.set_name"
                label="Set name*"
                required
              ></v-text-field>
              <v-textarea v-model="state.description" label="Description"></v-textarea>
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
              text="Create" 
              @click="createSet()"
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
    set_name: '',
		error: ''
	})
	var new_node = reactive({})
    var created = reactive([])

	const props = defineProps({
        mode: ''
    })


    async function createSet() {
        if(state.set_name && route.query.node) {
            try {
                await web.createSet(route.query.node, state.set_name, state.description)
                store.set_creator_open = false
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
    state.set_name = ''
		store.set_creator_open = false
	}




</script>
