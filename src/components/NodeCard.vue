


<template>

    <v-card v-if="store.current_node && store.current().id && schema.result._attributes" class="pa-6 text-black ">



            <template v-if="store.current().type != 'process' && store.current().type != 'set'">
                <a class="text-medium-emphasis" target="_blank" :href="'/api/files/' + store.current().id.replace('#','')">{{store.current().data.type_label}} open file</a> ({{ store.current().id }})
            </template>
            <template v-else><span class="text-medium-emphasis">ID: {{ store.current().id }}</span></template>

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
    



 

        <!-- THUMBNAIL -->
         <v-card-text class="pa-0">

             <div v-if="store.current().type == 'image' || store.current().type == 'pdf'">
                 <img  class="nodecard-image" :src="state.thumbnail" />
            </div>
            <p v-if="store.current().data.info"><i><v-icon class="mr-2">mdi-information</v-icon>{{ store.current().data.info }}</i></p>

        </v-card-text>


        <div class="card-actions d-flex justify-end w-100 pa-2" >
            
   
             <!-- DELETE BUTTON -->
            <v-btn  @click="store.node_deleter_open = true" right-0 class="btn btn-danger mr-10" color="red" title="delete item"><i class="bi bi-trash"></i></v-btn>
            
        </div>
    </v-card>

    <div v-else>

        <v-sheet
            class="pa-6 text-black "
        >
            <h4 v-if="store.current_project && store.current_project.data" class="text-h5 font-weight-bold mb-4">{{ store.current_project.data.label }}</h4>
            <h4 v-else class="text-h5 font-weight-bold mb-4">Desk</h4>
            
            <p v-if="store.current_project && store.current_project.data" class="">{{ store.current_project.data.description }}</p>
            <hr/>
            <p class="mb-8 font-italic">
            Here you you can see your files and how you have <b>processed</b> them.

            <br>
            <br>
            Import files from hamburger menu and crunch them.
            <br>
            <br>

            <v-card color="#EDE1CE" class="pa-6">TIP: You can quickly find your original files from hamburger menu.</v-card>
            </p>
        </v-sheet>
        </div>



</template>




<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import web from "../web.js";

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
        _access: null
    })
    
    var graph = reactive({result:[]})
    var schema = reactive({result:[]})
    var services = reactive({result:[]})
    var me = reactive({data:{}})
    var edit_name = ref('')
    const upload = ref(null);
    var add_new = reactive({type:'', label:''})
    var created = reactive([])
    var connect_editor = reactive({
        relation:{data:[]},
        data:[],
        current_node: '',
        current_rel_id: '',
        current_rel_attr: '',
        user_groups: []

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


    watch(
        () => route.query.node,
        async (newValue, oldValue) => {
            if(newValue)
                loadData(newValue)
            else
                schema.result = []

    })

    watch(
        () => store.current_node,
        async (newValue, oldValue) => {
            reset()
            if(newValue)
                loadData(store.current().id)
            else
                schema.result = []
    })

    watch(
      () => store.update,
      async (newValue, oldValue) => {
            await loadData(route.query.node) 

    })

    function empty(string) {
        return (!string || string.length === 0 );
    }

    function reset() {
        state.editing = false
        state.admin_edit = false
        state.image_edit = false
        state.selected = ''
        store.new_node_type = ''
        connect_editor.current_rel = ''
    }

    async function loadData(rid) {
        schema.result = await web.getSchemaAndData(rid)
        state.thumbnail = getThumbnail()
        if (schema.result._attributes['@type'] == 'Process')
            state.params = await getProcessParams()
        if (schema.result._attributes['@type'] !== 'Process')
            services.result = await web.getServicesForFile(rid)
        
    }

    function getThumbnail() {
        if(schema.result._attributes && schema.result._attributes.path)
            return 'api/thumbnails/' + removeLastPathPart(schema.result._attributes.path.replace('data/', ''))
    }



    async function getProcessParams() {
        var url = 'api/process/' + removeLastPathPart(schema.result._attributes.path.replace('data/', ''))
        var params = await web.getProcessParams(url)
        console.log(params)
        return params.data
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


    function toggleEdit(label) {
        state.edit_label = !state.edit_label
        if(state.edit_label)
            state.new_label = label
        
    }


    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
        }

    onMounted(async()=> {
        if(route.query.node) {
          //  loadData(route.query.node)
        }
    })

</script>
