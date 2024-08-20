


<template>

    <v-card v-if="store.current_node && store.current().id && schema.result._attributes">

        <v-card-title>

            <template v-if="store.current().type != 'process' && store.current().type != 'set'">
                <a target="_blank" :href="'/api/files/' + store.current().id.replace('#','')">{{store.current().data.type_label}} open file</a> ({{ store.current().id }})
            </template>
            <template v-else>ID: {{ store.current().id }}</template>



            <div class="d-flex bd-highlight">


                <template v-if="store.current().type == 'text'">
                  
                  <h4 class="text-wrap"> {{schema.result._attributes.label}}
               
                    <i @click="toggleEdit(schema.result._attributes.label)" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                    <v-text-field v-if="state.edit_label" v-model="state.new_label" @keyup.enter="saveLabel()"></v-text-field>


                    </h4>
                </template>

                <template v-else-if="store.current().type == 'image'">
                    
                    <h4 class="text-wrap"> {{schema.result._attributes.label}}
                    
                        <i @click="toggleEdit(schema.result._attributes.label)" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                        <v-text-field v-if="state.edit_label" v-model="state.new_label" @keyup.enter="saveLabel()"></v-text-field>

                    </h4>
                </template>


                <template v-else-if="store.current().type == 'set'">
                    
                    <h4 class="text-wrap"> {{schema.result._attributes.label}}
                    
                        <i @click="toggleEdit(schema.result._attributes.label)" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                        <v-text-field v-if="state.edit_label" v-model="state.new_label" @keyup.enter="saveLabel()"></v-text-field>

                    </h4>

  
                </template>



                <template v-else>
                    <h4 class="text-wrap">     {{schema.result._attributes.label}}
                        <i @click="toggleEdit(schema.result._attributes.label)" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                        <v-text-field v-if="state.edit_label" v-model="state.new_label" @keyup.enter="saveLabel()"></v-text-field>

                    </h4>
                </template>
                </div>
            

            <div v-if="editable()">
                <div role="button" @click="state.editing = true" class="btn btn-primary float-end" title="Edit item">
                    <i class="bi bi-pen" style="font-size: 1rem; color: white;"></i>
                </div>
            </div>

        </v-card-title>

        <!-- THUMBNAIL -->
         <v-card-text>

             <div v-if="store.current().type == 'image' || store.current().type == 'pdf'">
                 <img style="max-height: 160px;" class="nodecard-image" :src="state.thumbnail" />
                </div>
                <v-container v-else>
                    <div v-if="state.params.info">{{ state.params.info }}</div>
                    <div v-if="store.current_node && store.current_node.data">{{ store.current_node.data.description }}</div>
                </v-container>
        </v-card-text>



        <v-card-actions>
   
             <!-- DELETE BUTTON -->
            <div class="float-end"  v-if="store.current().type != 'Person'">
                <button @click="store.node_deleter_open = true" class="btn btn-danger" title="delete item"><i class="bi bi-trash"></i></button>
            </div>
        </v-card-actions>
    </v-card>

    <div v-else>

        <v-sheet
            border="md"
            class="pa-6 text-black "
        >
            <h4 class="text-h5 font-weight-bold mb-4">Cruncher view</h4>

            <p class="mb-8">
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
        edit_label: false,
        new_label: '',
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

    // users can edit only their own links + data. Admin can edit all
    function editable() {
        if(store.current().data.id == '#' + route.query.node) {
            if(store.current().data.id == store.user.rid || store.user.access == 'admin')
                return true
        }
        return false
    }

    function setEdit() {
        reset()
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


    async function saveLabel() {
        var result = await web.setNodeAttribute(store.current().id, {key:'label', value: state.new_label})
        emit('updateGraph', {id: store.current().id, name: state.new_label})
        state.edit_label = false
        
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
