
<template>
    <div >

		<v-sheet class="pa-6 text-black md-project">
			<div v-if="store.current_node && state.project" >
                <div class="text-medium-emphasis">{{ store.current_node.data.file_count}}</div>

                <h3 v-if="state.edit_label_open == false" @click="editLabel()" class="font-weight-bold mb-4">{{ store.current_node.data.label }}</h3>
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
                
                
                <div v-if="empty(store.current_node.data.description)" @click="editDescription()" class="text-medium-emphasis">add description</div>
                <pre v-if="state.edit_description_open == false" @click="editDescription()">{{ store.current_node.data.description}}</pre>
                    
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


                <div >
                    <v-img v-for="f in store.current_node.data.paths" :src="f" class="w-50 shadow-1-strong rounded ma-4"/>
                </div>
                
			</div>

                    
            <div v-else>


                <h4 class="text-h5 font-weight-bold mb-4">Desks view</h4>

                <p class="mb-8">
                Here you you can see your desks and you can arrange them visually.

                <br>
                <br>
                Double click desk node to open it.
                <br>
                <br>



                <v-card color="#EDE1CE" class="pa-6">TIP: You can quickly find your desks from hamburger menu.</v-card>
                </p>
                <v-btn color="primary" @click="$emit('create-project')">Create desk</v-btn>
            </div>
            


            </v-sheet>
    

    </div>
</template>


<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import {store} from "./Store.js";
    import web from "../web.js";

    const emit = defineEmits(['create-project'])

    var state = reactive({
        items: [],
        creator_open: false,
        project_name: '',
        error: '',
        project: null,
        edit_description: '',
        edit_description_open: false,
        edit_label: '',
        edit_label_open: false

    })

    watch(
        () => store.current_node,
        async (newValue, oldValue) => {
            if(newValue)
                await getProjectData()
            else    
                state.project = null
    })

    function empty(string) {
        return (!string || string.length === 0 );
    }

    function resetEdits() {
        state.edit_description = ''
        state.edit_description_open = false
        state.edit_label = ''
        state.edit_label_open = false
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
    async function getProjectData() {
        resetEdits()
        if(store.current_node)
            state.project = await web.getProject(store.current_node.id)

    }

    onMounted(async()=> {
        var response = await web.getProjects()
        store.current_node = null
        state.items = response
    })


</script>
