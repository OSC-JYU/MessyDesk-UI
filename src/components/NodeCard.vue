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
    <div class="card" v-if="store.current_node && store.current().id && schema.result._attributes">

        <div class="card-header">

            <template v-if="store.current().type != 'process'">
                <a target="_blank" :href="'/api/files/' + store.current().id.replace('#','')">{{store.current().data.type_label}} {{ store.current().id }}</a>
            </template>
            <template v-else>{{ store.current().id }}</template>



            <div class="d-flex bd-highlight">


                <template v-if="store.current().type == 'text'">
                  
                  <h4 :class="['card-title', 'p-2', 'flex-grow-1']"> {{schema.result._attributes.label}}
               
                      <i @click="toggleEdit()" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                      </i>
                      <input v-if="edit_name" v-model="edit_name" @keyup.enter="saveLabel()"/>

                  </h4>
              </template>

                <template v-else-if="store.current().type == 'image'">
                  
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




            <!-- {{ schema.result._attributes.path }} -->



        </div>

        <!-- THUMBNAIL -->
        <div v-if="store.current().type == 'image' || store.current().type == 'pdf'">
            <img style="max-height: 160px;" class="nodecard-image" :src="state.thumbnail" />
        </div>
        <v-container v-else>
            <div v-if="state.params.info">{{ state.params.info }}</div>
        </v-container>
       

        <!-- CRUNCHERS -->
        <div v-if="!['Process', 'Project','Person'].includes(store.current().type)" class="card-body overflow-auto">
            <h5 v-if="store.current().type != 'process'">Things that you can do with your {{ schema.result._attributes.type }}</h5>
           <!-- {{ store.current().data }}-->

            <div>
                <div v-if="services.result && services.result.for_format && services.result.for_format.length == 0" class="alert alert-warning">No crunchers found</div>
                <div v-if="store.current().data.type == 'set'">
                    <ol class="card" v-for="service in services.result.for_type">
                        <template v-if="service.tasks">
                            <li class="list-group-item border-0" v-for="(value, key) of service.tasks" :key="key">
                                <div @click="initProcessCreator(service, key)" class="node Service pointer"> {{ value.name }} </div>
                                <div class="rel-info">{{ value.description }}</div><div class="badge rel-info bg-secondary">{{service.name}}</div>
                            </li>
                        </template>
                    </ol>
                </div>
                <ol class="list-group border-0" v-for="service in services.result.for_format">
                    <template v-if="service.tasks">
                        <li class="list-group-item border-0" v-for="(value, key) of service.tasks" :key="key">
                            <div @click="initProcessCreator(service, key)" class="node Service pointer"> {{ value.name }} </div>
                            <div class="rel-info">{{ value.description }}</div><div class="badge rel-info bg-secondary">{{service.name}}</div>
                        </li>
                    </template>
                </ol>

                <div>
            </div>
        </div>


  </div>
       
    
<!--
        <NodeAttributes v-if="schema.result._attributes" :editing="state.editing" :attributes="schema.result._attributes"  @reLoadData="loadData"/>
-->



        <div :class="['card-body overflow-auto', schema.result._attributes._active ? '' : 'disabled']">





        </div>
        <div class="card-footer">
   
             <!-- DELETE BUTTON -->
            <div class="float-end"  v-if="store.current().type != 'Person'">
                <button @click="store.node_deleter_open = true" class="btn btn-danger" title="delete item"><i class="bi bi-trash"></i></button>
            </div>
        </div>
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
    const emit = defineEmits(['fitGraph', 'saveLayout', 'setGraphOptions'])


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
        prepareUserSettings()
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

    function prepareUserSettings() {
        state._group = null
        state._access = null
        if(schema.result._attributes && schema.result._attributes['@type'] == 'Person') {
            state._group = schema.result._attributes._group
            state._access = schema.result._attributes._access
        }
    }

    function initProcessCreator(data, task_id) {
        console.log(data)
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
