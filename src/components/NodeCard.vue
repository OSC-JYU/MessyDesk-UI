<style scoped>
.overflow-scroll {
    overflow-y: auto;
    flex: 1;
    padding-bottom: 16px;
}

.nodecard-container {
    background: #fafafa;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    height: 100%;
    display: flex;
    flex-direction: column;
}

.nodecard-header {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 16px;
    margin-bottom: 16px;
}

.nodecard-id {
    font-size: 0.75rem;
    color: #666;
    font-family: monospace;
    background: #f5f5f5;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
}

.nodecard-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
    margin: 8px 0;
    cursor: pointer;
    transition: color 0.2s;
}

.nodecard-title:hover {
    color: #1976d2;
}

.nodecard-placeholder {
    color: #999;
    font-style: italic;
    cursor: pointer;
    padding: 8px 0;
    border: 1px dashed #ddd;
    border-radius: 4px;
    text-align: center;
    transition: all 0.2s;
}

.nodecard-placeholder:hover {
    color: #666;
    border-color: #bbb;
}

.nodecard-description {
    color: #555;
    line-height: 1.5;
    margin: 16px 0;
    white-space: pre-wrap;
    cursor: pointer;
    padding: 12px;
    background: #f9f9f9;
    border-radius: 4px;
    border-left: 3px solid #e0e0e0;
    transition: all 0.2s;
}

.nodecard-description:hover {
    background: #f0f0f0;
    border-left-color: #1976d2;
}

.nodecard-actions {
    padding: 16px 0;
    border-top: 1px solid #e0e0e0;
    background: #fafafa;
    margin-top: auto;
    flex-shrink: 0;
}

.nodecard-button {
    text-transform: none;
    font-weight: 500;
    border-radius: 6px;
    margin-left: 8px;
}

.nodecard-button--primary {
    background: #1976d2;
    color: white;
}

.nodecard-button--secondary {
    background: #f5f5f5;
    color: #666;
    border: 1px solid #ddd;
}

.nodecard-button--danger {
    background: #f44336 !important;
    color: white !important;
    box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
    opacity: 1 !important;
    visibility: visible !important;
    display: inline-flex !important;
}

.nodecard-button--danger:hover {
    background: #d32f2f !important;
    box-shadow: 0 4px 8px rgba(244, 67, 54, 0.4);
}

.nodecard-image {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nodecard-info {
    color: #666;
    font-style: italic;
    margin: 8px 0;
}

.nodecard-metadata {
    font-family: monospace;
    font-size: 0.875rem;
    color: #666;
    background: #f8f8f8;
    padding: 8px;
    border-radius: 4px;
    margin: 8px 0;
}

.nodecard-prompt {
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 6px;
    padding: 12px;
    margin: 16px 0;
}

.nodecard-error {
    background: #ffebee;
    border: 1px solid #ffcdd2;
    border-radius: 6px;
    padding: 12px;
    color: #c62828;
}

.nodecard-upload-hint {
    background: #fff3e0;
    border: 1px solid #ffcc02;
    border-radius: 6px;
    padding: 16px;
    margin: 16px 0;
    text-align: center;
    color: #e65100;
}
</style>


<template>

    <v-sheet v-if="store.current_node && store.current().id" class="nodecard-container pa-6">

        <!-- HEADER -->
        <div class="nodecard-header">
            <div class="nodecard-id">{{ store.current_node.id }}</div>
            
            <!-- LABEL-->
            <div v-if="empty(store.current_node.data.label)" @click="editLabel()" class="nodecard-placeholder">add label</div>
            <h4 v-if="state.edit_label_open == false" @click="editLabel()" class="nodecard-title">{{ store.current_node.data.label }}</h4>
            
            <v-card v-else class="pa-4" elevation="1"> 
                <v-text-field @keyup.enter="saveLabel()"
                    label="Label"
                    v-model="state.edit_label"
                    variant="outlined"
                    density="compact"
                ></v-text-field>
                <v-card-actions class="pa-0">
                    <v-btn @click="closeLabel()" variant="text" size="small">Cancel</v-btn>
                    <v-btn @click="saveLabel()" variant="text" size="small" class="nodecard-button--primary">Save</v-btn>
                </v-card-actions>
            </v-card>
            
            <div v-if="store.current_node.data.count" class="nodecard-info">files: {{ store.current_node.data.count }}</div>
        </div>
             
        <!-- DESCRIPTION -->
        <div v-if="empty(store.current_node.data.description)" @click="editDescription()" class="nodecard-placeholder">add description</div>
        
        <div v-if="state.edit_description_open == false" @click="editDescription()" class="nodecard-description">{{ store.current_node.data.description}}</div>
        
        <v-card v-else class="pa-4" elevation="1"> 
            <v-textarea 
                label="Description"
                v-model="state.edit_description"
                variant="outlined"
                density="compact"
                auto-grow
            ></v-textarea>
            <v-card-actions class="pa-0">
                <v-btn @click="closeDescription()" variant="text" size="small">Cancel</v-btn>
                <v-btn @click="saveDescription()" variant="text" size="small" class="nodecard-button--primary">Save</v-btn>
            </v-card-actions>
        </v-card>

        <!-- SHOW DETAILS BUTTON (moved after description) -->
        <div v-if="store.current().type == 'process' || store.current().type == 'setprocess'" class="text-center mt-4">
            <v-btn @click="showDetail()" class="nodecard-button nodecard-button--primary" size="small">
                <v-icon start>mdi-eye</v-icon>
                Show details
            </v-btn>
        </div>

        <!-- PROMPT -->
        <div v-if="state.prompt" class="nodecard-prompt">
            <v-icon start icon="mdi-message-text" class="mr-2"></v-icon>
            {{ state.prompt }}
        </div>
    
        <!-- ERROR -->
        <div v-if="store.current_node.data.error" class="nodecard-error">
            Something went wrong processing this cruncher.
        </div>

        <!-- CONTENT -->
        <div class="overflow-scroll">
            <div v-if="store.current().type == 'image' || store.current().type == 'pdf'">
                <img class="nodecard-image" :src="store.current().data.image" />
            </div>
            
            <div v-if="store.current().data.info" class="nodecard-info">
                <v-icon class="mr-2">mdi-information</v-icon>{{ store.current().data.info }}
            </div>
            
            <div v-if="store.current().data.metadata" class="nodecard-metadata">
                {{ store.current().data.metadata }}
            </div>
            
            <div class="text-center mt-4">
                <template v-if="!['set', 'process', 'source','project', 'setprocess'].includes(store.current().type)">
                    <a title="opens file in new tab" target="_blank" :href="apiUrl + '/api/files/' + store.current().id.replace('#','')">
                        <v-btn class="nodecard-button nodecard-button--secondary" size="small">Open full file</v-btn>
                    </a> 
                </template>

                <template v-if="store.current().type == 'set'">
                    <a title="opens file in new tab" target="_blank" :href="apiUrl + '/api/sets/' + store.current().id.replace('#','') + '/files/zip'">
                        <v-btn class="nodecard-button nodecard-button--secondary" size="small">Download set</v-btn>
                    </a> 
                </template>
            </div>
        </div>

        <!-- DELETE BUTTON -->
        <div class="nodecard-actions d-flex justify-end">
            <v-btn @click="store.node_deleter_open = true" 
                   class="nodecard-button nodecard-button--danger" 
                   size="small" 
                   title="delete item"
                   variant="elevated">
                <v-icon start>mdi-delete</v-icon>
                Delete
            </v-btn>
        </div>
    </v-sheet>



    <div v-else>
        <v-sheet class="nodecard-container pa-6" style="height: 100%; display: flex; flex-direction: column;">
            <div class="nodecard-header">
                <h4 v-if="store.current_project && store.current_project.data" class="nodecard-title">{{ store.current_project.data.label }}</h4>
                <h4 v-else class="nodecard-title">Desk</h4>
                
                <p v-if="store.current_project && store.current_project.data" class="nodecard-description">{{ store.current_project.data.description }}</p>
            </div>
            
            <div class="nodecard-upload-hint">
                Upload files and click the cookie in order to see available crunchers.
            </div>
            
            <p class="nodecard-description">
                Here you can see your files and how you have <strong>processed</strong> them with Crunchers.
            </p>
            
            <div class="text-center mt-4">
                <v-btn @click="store.uploader_open = true" class="nodecard-button nodecard-button--primary" size="small">
                    <v-icon start>mdi-upload</v-icon>
                    Upload file
                </v-btn>
            </div>
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

    function showDetail() {
        // Toggle detail view or emit event to parent component
        console.log('Show detail for node:', store.current_node.id)
        // You can implement the detail view logic here or emit an event
        // emit('showDetail', store.current_node)
    }


</script>
