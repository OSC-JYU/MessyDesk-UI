<template>

	<!-- Modal -->

    <v-dialog
      v-model="store.source_creator_open"
      width="auto"
    >
      <v-card
        min-width="600"
        prepend-icon="mdi-folder"
        :title="'Create ' + store.source_creator_type + ' source'"
      >
      <v-card-text>

        <v-col>
          <v-text-field v-model="state.source_name"
                label="Source name*"
                required
              ></v-text-field>
            <template v-if="store.source_creator_type == 'nextcloud'">
              <v-text-field v-model="state.url"
                label="Nextcloud URL* (full URL to your SHARED folder)"
                required
              ></v-text-field>
              <v-alert v-if="store.source_creator_type == 'nextcloud'" type="info" >Here is a demo folder that you can use for testing:<br>https://nextcloud.jyu.fi/index.php/s/nGwmKcP3wy8pHJx</v-alert>
            </template>
            <template v-if="store.source_creator_type == 'dspace7'">
              <v-text-field v-model="state.url"
                label="Dspace7 REST api URL*"
                required
              ></v-text-field>
              <v-alert v-if="store.source_creator_type == 'dspace7'" type="info" >Here is a demo folder that you can use for testing:<br>https://demo.dspace.org/server/api/discover/search</v-alert>
            </template>

              
              
              <v-textarea v-model="state.description" label="Description of your data"></v-textarea>
              Note that creating a source *does not* automatically import data.
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
              @click="createSource()"
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
    source_name: '',
    url: '',
    description: '',
		error: ''
	})
	var new_node = reactive({})
    var created = reactive([])

	const props = defineProps({
        mode: ''
    })

  const emit = defineEmits(['updateGraph'])

  function getProjectRid() {
    if (route.params?.rid) return String(route.params.rid)
    if (route.query?.node) return String(route.query.node)
    if (store.current_project?.id) return String(store.current_project.id).replace('#', '')
    if (store.current_node?.project_rid) return String(store.current_node.project_rid).replace('#', '')
    return null
  }

    async function createSource() {
    const projectRid = getProjectRid()
    if(state.source_name && projectRid) {
            try {
        var response = await web.createSource(projectRid, state, store.source_creator_type)
                console.log(response)
                store.source_creator_open = false
                //emit('updateGraph', response['@rid'])
                store.reload({id:response['@rid']})
            } catch(e) {
                if(e.response && e.response.data.error)
                    alert(e.response.data.error)
                else
                    alert(e)
            }
            } else if (state.source_name && !projectRid) {
              alert('Project context missing. Open a project and try again.')
        }
    }

	function close() {
    state.set_name = ''
		store.source_creator_open = false
	}




</script>
