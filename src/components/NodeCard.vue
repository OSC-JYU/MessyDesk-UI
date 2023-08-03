<style>
    .person-photo {
        width: 80px;
        margin-left: 0px;
    }


</style>

<template>

    <!-- information about query-->
    <!-- <div v-if="route.query.query">
        <div class="card-header"><h4>{{ current_query.menu }} - {{ current_query.label}}</h4> </div>
        
    </div> -->

    <!-- node card --> 
    <div class="card" v-if="store.current_node && schema.result._attributes">

        <div class="card-header">

            <template v-if="store.current().data.type == 'Person'">
                {{schema.result._attributes.id}}
            </template>
            <template v-else-if="store.current().data.type == 'File'">
                <a target="_blank" :href="'/api/files/' + store.current().data.id.replace('#','')">{{store.current().data.type_label}} {{ store.current().data.id }}</a>
                
            </template>

            <div class="d-flex bd-highlight">

                <template v-if="store.current().data.type == 'Person'">
                    <img v-if="store.current().data.image" class="person-photo" :src="store.current().data.image" />
                    <img v-else class="person-photo" :src="'icons/person_icon.svg'" />


                    <h4 :class="['card-title', 'p-2', 'flex-grow-1']">     {{schema.result._attributes.label}}
                        <i v-if="state.editing && schema.result._attributes._active" @click="toggleEdit()" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                        <input v-if="state.editing && edit_name" v-model="edit_name" @keyup.enter="saveLabel()"/>
                    </h4>
                </template>


                <template v-else-if="store.current().data.type == 'File'">

                    <h4 :class="['card-title', 'p-2', 'flex-grow-1']"> {{schema.result._attributes.label}}
                 
                        <i @click="toggleEdit()" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                        <input v-if="edit_name" v-model="edit_name" @keyup.enter="saveLabel()"/>

                    </h4>
                   




                </template>

                <template v-else>
                        <h4 :class="['card-title', 'p-2', 'flex-grow-1']">     {{schema.result._attributes.label}}
                        <i  @click="toggleEdit()" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                        <input v-if="edit_name" v-model="edit_name" @keyup.enter="saveLabel()"/>
                    </h4>

                </template>

            </div>

            
 

            <div v-if="editable()">
                <div role="button" @click="state.editing = true" class="btn btn-primary float-end" title="Edit item">
                    <i class="bi bi-pen" style="font-size: 1rem; color: white;"></i>
                </div>
            </div>




            <i v-if="!schema.result._attributes._active" class="alert alert-warning">Inactive</i>



        </div>

        <!-- THUMBNAIL -->
        <div>
            <img :src="state.thumbnail" />
        </div>
        {{ schema.result }}

        <!-- CRUNCHERS -->
        <div v-if="!['Process', 'Project','Person'].includes(store.current().data.type)" class="card-body overflow-auto">
            <h4>Crunchers for {{ schema.result._attributes.type }}</h4>

            <div v-if="services.result && services.result.for_format && services.result.for_format.length == 0" class="alert alert-warning">No crunchers found</div>

            <ol class="list-group border-0" v-for="service in services.result.for_format">
                <template v-if="service.tasks">
                    <li class="list-group-item border-0" v-for="(value, key) of service.tasks" :key="key">
                        <div @click="initProcessCreator(service, key)" class="node Service pointer"> {{ value.name }} </div>
                        <div class="rel-info">{{ value.description }}</div>
                    </li>
                </template>
            </ol>

        <div>

            <!-- CRUNCHERS ENDS -->
    </div>


  </div>
       
    
<!--
        <NodeAttributes v-if="schema.result._attributes" :editing="state.editing" :attributes="schema.result._attributes"  @reLoadData="loadData"/>
-->



        <div :class="['card-body overflow-auto', schema.result._attributes._active ? '' : 'disabled']">





        </div>
        <div class="card-footer">
   
             <!-- DELETE BUTTON -->
            <div class="float-end"  v-if="store.current().data.type != 'Person'">
                <button @click="store.node_deleter_open = true" class="btn btn-danger" title="delete item"><i class="bi bi-trash"></i></button>
            </div>
        </div>
    </div>

</template>




<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
    import NodeAttributes from './NodeAttributes.vue'
    import {store} from "./Store.js";
    import web from "../web.js";

    const route  = useRoute();
    const router = useRouter();

    var state = reactive({
        thumbnail: 'api/thumbnails/data/projects/228_5/files/108_18',
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
    const emit = defineEmits(['fitGraph', 'saveLayout', 'setGraphOptions'])


    onMounted(async()=> {
        if(route.query.node) {
            loadData(route.query.node)
        }
    })

    watch(
        () => route.query.node,
        async (newValue, oldValue) => {
            console.log('ROUTER: on query.node')
            if(newValue)
                loadData(newValue)
            else
                schema.result = []

    })

    watch(
        () => store.current_node,
        async (newValue, oldValue) => {
            console.log('ROUTER: on current_node')
            reset()
            if(newValue)
                loadData(store.current().data.id)
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
        console.log('loading node data...')
        schema.result = await web.getSchemaAndData(rid)
        services.result = await web.getServicesForFile(rid)
        prepareUserSettings()
    }



    function prepareUserSettings() {
        state._group = null
        state._access = null
        if(schema.result._attributes && schema.result._attributes['@type'] == 'Person') {
            state._group = schema.result._attributes._group
            state._access = schema.result._attributes._access
        }
    }

    function initProcessCreator(data, task_id) {
        store.process = data
        store.task_id = task_id
        store.new_node_label = 'Process'
        store.new_node_relation = 'WAS_PROCESSED_BY'
        store.process_creator_open = true
    }


    async function saveLabel() {
        var result = await web.setNodeAttribute(store.current().data.id, {key:'label', value: edit_name.value})
        store.reload({id: store.current().data.id, name: edit_name.value})
        edit_name.value = ''
    }


    function toggleEdit() {
        if(edit_name.value == '')
            edit_name.value = store.current().data.name
        else {
            edit_name.value = ''
        }
    }


</script>
