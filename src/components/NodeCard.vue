<style scoped>

.overflow-scroll {
    overflow-y: scroll;
    height: 85%;
}
</style>


<template>

    <v-sheet v-if="store.current_node && store.current().id" class="pa-6 text-black ">

        <span class="text-caption">{{ store.current_node.id }}</span>
        <!-- LABEL-->
        <div v-if="empty(store.current_node.data.label)" @click="editLabel()" class="text-medium-emphasis">add label</div>
        <h4 v-if="state.edit_label_open == false" @click="editLabel()" class="font-weight-bold mb-4">{{ store.current_node.data.label }}</h4>
        
        
        <v-card v-else class="pa-6"> 
            <v-text-field @keyup.enter="saveLabel()"
                label="Description"
                v-model="state.edit_label"
                name="input-7-1"
                variant="filled"
                auto-grow
            ></v-text-field>
            <v-card-actions>
                <v-btn @click="closeLabel()">Cancel</v-btn>
                <v-btn @click="saveLabel()">Save</v-btn>
            </v-card-actions>
        
        </v-card>
        <hr/>
        <div v-if="store.current_node.data.count">files: {{ store.current_node.data.count }}</div>
              
             
        <!-- DESCRIPTION -->
        <div v-if="empty(store.current_node.data.description)" @click="editDescription()" class="text-medium-emphasis">add description</div>
        
        <pre v-if="state.edit_description_open == false" @click="editDescription()" class="mb-8 font-italic">{{ store.current_node.data.description}}</pre>
        
        <v-card v-else class="pa-6"> 
            <v-textarea 
            label="Description"
            v-model="state.edit_description"
            name="input-7-1"
            variant="filled"
            auto-grow
            ></v-textarea>
            <v-card-actions>
                <v-btn @click="closeDescription()">Cancel</v-btn>
                <v-btn @click="saveDescription()">Save</v-btn>
            </v-card-actions>
        
        </v-card>

        <div v-if="state.prompt" class="mt-4 mb-4">
          <v-alert type="info" variant="tonal">
            <v-icon start icon="mdi-message-text" class="mr-2"></v-icon>
            {{ state.prompt }}
          </v-alert>
        </div>
    
        <!-- ERROR -->
        <v-card-text class="pa-0 overflow-scroll" v-if="store.current_node.data.error">
            <v-alert type="error"  @click="editDescription()" class="text-medium-emphasis">Something went wrong processing this cruncher.</v-alert>
            <v-btn  @click="getError()">show error</v-btn>
            <pre>{{ state.full_error }}</pre>
        </v-card-text>

        <!-- THUMBNAIL -->
         <v-card-text class="pa-0 overflow-scroll">

             <div v-if="store.current().type == 'image' || store.current().type == 'pdf'">
                 <img  class="nodecard-image" :src="store.current().data.image" />
            </div>
            <p v-if="store.current().data.info"><i><v-icon class="mr-2">mdi-information</v-icon>{{ store.current().data.info }}</i></p>
            {{ store.current().data.metadata }}
            
            <template v-if="!['set', 'process', 'source','project', 'setprocess'].includes(store.current().type)">
                <a title="opens file in new tab" class="text-medium-emphasis" target="_blank" :href="apiUrl + '/api/files/' + store.current().id.replace('#','')">
                    <v-btn  color="secondary" class="mt-3">open full file</v-btn>
                </a> 

            </template>

            <template v-if="store.current().type == 'set'">
                <a title="opens file in new tab" class="text-medium-emphasis" target="_blank" :href="apiUrl + '/api/sets/' + store.current().id.replace('#','') + '/files/zip'">
                    <v-btn  color="secondary" class="mt-3">download set</v-btn>
                </a> 
            </template>

        </v-card-text>


        <!-- ACTIONS -->
        <div class="card-actions d-flex justify-end w-100 pa-2" >
            
   
             <!-- DELETE BUTTON -->
            <v-btn  @click="store.node_deleter_open = true" right-0 class="btn btn-danger mr-10" color="red" title="delete item"><i class="bi bi-trash"></i></v-btn>
            
        </div>
    </v-sheet>



    <div v-else>

        <v-sheet
            class="pa-6 text-black "
        >
            <h4 v-if="store.current_project && store.current_project.data" class="text-h5 font-weight-bold mb-4">{{ store.current_project.data.label }}</h4>
            <h4 v-else class="text-h5 font-weight-bold mb-4">Desk</h4>
            
            <p v-if="store.current_project && store.current_project.data" class="">{{ store.current_project.data.description }}</p>
            <hr/>
            <p class="mb-8 font-italic">
            Here you you can see your files and how you have <b>processed</b> them with Crunchers.

            <br>
           
            <v-card color="#EDE1CE" class="pa-6 mt-6">Upload files and click the cookie in order to see available crunchers.</v-card>

        </p>
            <v-btn color="primary" @click="store.uploader_open = true" >Upload file</v-btn>

            <!-- <v-card color="#EDE1CE" class="pa-6">TIP: You can quickly find your original files from hamburger menu.</v-card> -->
            
        </v-sheet>
        </div>



</template>




<script setup>
    import { reactive, computed, watch } from "vue";
    import { useRouter, useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import web from "../web.js";
    const apiUrl = import.meta.env.VITE_API_PATH;

    const route  = useRoute();
    const router = useRouter();

    var state = reactive({
        edit_description: '',
        edit_description_open: false,
        edit_label: '',
        edit_label_open: false,
        thumbnail: '',
        params: '',
        editing: false,
        active: true,
        selected: null,
        admin_edit: false,
        image_edit: false,
        show_loader: false,
        _group: null,
        _access: null,
        error: null,
        full_error: null
    })
    

    watch(
        () => store.current_node,
        async (newValue, oldValue) => {
            state.full_error = null
            state.editing = false
            state.edit_description = ''
            state.edit_description_open = false
            state.edit_label_open = false
            state.edit_label = ''
            try {
                state.prompt = JSON.parse(store.current_node.data.params).system_params.prompts.content
            } catch(e) {
                state.prompt = ''
            }
    })

    const current_query = computed(() => {
        var m = {label:''}
        for (var menu of store.menus) {
            for(var item of menu.items) {
                if(item['@rid'] == '#' + route.query.query)
                    m.label = item.label
                    m.menu = menu.label
            }
        }
        return m
    })

    const permissions = ['user', 'creator', 'admin']
    const emit = defineEmits(['updateGraph'])


    function empty(string) {
        return (!string || string.trim().length === 0 );
    }

    async function getError() {
        var rid = store.current().id.replace('#','')
        var response = await web.getError(rid)
        state.full_error = 'ERROR:\n' + JSON.stringify(response.code) + '\n\nMESSAGE:\n\n' + JSON.stringify(response.message) + '\n\n'
    }

    function editLabel() {
        state.edit_label = store.current_node.data.label
        state.edit_label_open = true
    }

    function closeLabel() {
        state.edit_label = ''
        state.edit_label_open = false
    }

    function saveLabel() {
        if (empty(state.edit_label)) return
        web.setNodeAttribute(store.current_node.id, {key:'label', value: state.edit_label})
        store.current_node.data.label = state.edit_label
        state.edit_label = ''
        state.edit_label_open = false
    }
    function editDescription() {
        state.edit_description = store.current_node.data.description
        state.edit_description_open = true
    }

    function closeDescription() {
        state.edit_description = ''
        state.edit_description_open = false
    }

    function saveDescription() {
        web.setNodeAttribute(store.current_node.id, {key:'description', value: state.edit_description})
        store.current_node.data.description = state.edit_description
        state.edit_description = ''
        state.edit_description_open = false
    }


</script>
