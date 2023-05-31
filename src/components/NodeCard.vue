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
            <template v-else>
                {{store.current().data.type_label}} {{ store.current().data.id }}
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

                <template v-else>
                    <img v-if="store.current().data.image" class="person-photo" :src="store.current().data.image" />



                    <h4 :class="['card-title', 'p-2', 'flex-grow-1']">     {{schema.result._attributes.label}}
                        <i v-if="state.editing && schema.result._attributes._active" @click="toggleEdit()" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                        <input v-if="state.editing && edit_name" v-model="edit_name" @keyup.enter="saveLabel()"/>
                    </h4>
                </template>

            </div>


            <!-- EDIT BUTTON -->
            <div v-if="editable()">
                <div role="button" @click="state.editing = true" class="btn btn-primary float-end" title="Edit item">
                    <i class="bi bi-pen" style="font-size: 1rem; color: white;"></i>
                </div>
            </div>




            <i v-if="!schema.result._attributes._active" class="alert alert-warning">Inactive</i>



        </div>

        <!-- CRUNCHERS -->
        <div v-if="!['Process', 'Project','Person'].includes(store.current().data.type)" class="card-body overflow-auto">
            <h4>Crunchers for {{ schema.result._attributes.type }}</h4>

            <div v-if="services.result && services.result.for_format && services.result.for_format.length == 0" class="alert alert-warning">No services found</div>

            <ol class="list-group border-0" v-for="service in services.result.for_format">
                <template v-if="service.crunchers">
                    <li class="list-group-item border-0" v-for="(value, key) of service.crunchers" :key="key">
                        <div @click="initProcessCreator(service, key)" class="node Service pointer"> {{ value.name }} </div>
                        <div class="rel-info">{{ value.description }}</div>
                    </li>
                </template>
            </ol>

            <div>
        </div>

         <!-- CRUNCHERS ENDS -->

  </div>
       
    
<!--
        <NodeAttributes v-if="schema.result._attributes" :editing="state.editing" :attributes="schema.result._attributes"  @reLoadData="loadData"/>
-->



        <div :class="['card-body overflow-auto', schema.result._attributes._active ? '' : 'disabled']">



            <!-- DELETE BUTTON -->
            <div class="float-end" style="margin-top:50px" v-if="state.editing  && store.user.access !== 'user' && store.current().data.id !== store.user.rid">
                <button @click="store.node_deleter_open = true" class="btn btn-danger" title="delete item"><i class="bi bi-trash"></i></button>
            </div>

        </div>
        <div class="card-footer">


            <div v-if="store.user">
                <hr>
                <div v-if="state.editing && store.current().data.type == 'Person' && store.user.access == 'admin'">
                    <a href="#" @click.prevent="state.admin_edit = !state.admin_edit">{{store.user.id}} [{{store.user.group}} : {{store.user.access}}]</a>
                </div>
                <div v-else>
                    {{store.user.id}}  [{{store.user.group}} : {{store.user.access}}]
                </div>
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
        editing: false,
        active: true,
        selected: null,
        admin_edit: false,
        image_edit: false,
        _group: null,
        _access: null
    })
    var graph = reactive({result:[]})
    var schema = reactive({result:[]})
    var services = reactive({result:[]})
    var me = reactive({data:{}})
    var edit_name = ref('')
    const image_file = ref(null);
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
            // update connection editor if open
            if(connect_editor.relation.type) {
                var result = await web.getListOfNonConnected(connect_editor.relation.target, connect_editor.relation.type, route.query.node)
                connect_editor.data = result.data
                for(var s of schema.result) {
                    if(s.type == connect_editor.relation.type) {
                        connect_editor.relation = s
                    }
                }
            }
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



    async function sendImage() {
        if(image_file.value.files.length) {
            try {
                await web.uploadImage(image_file.value.files[0], store.current().data.id)
                await web.setNodeAttribute(store.current().data.id, {key:'_image', value: 'images/' + store.current().data.id.replace('#','') + '.png'})
                window.location.reload()
            } catch(e) {
                if(e.response && e.response.data.error)
                    alert(e.response.data.error)
                else
                    alert(e)
            }
        }
    }

    function prepareUserSettings() {
        state._group = null
        state._access = null
        if(schema.result._attributes && schema.result._attributes['@type'] == 'Person') {
            state._group = schema.result._attributes._group
            state._access = schema.result._attributes._access
        }
    }

    function initProcessCreator(data, service_id) {
        store.process = data
        store.process_id = service_id
        store.new_node_label = 'Process'
        store.new_node_relation = 'WAS_PROCESSED_BY'
        store.process_creator_open = true
    }




    async function saveLabel() {
        var result = await web.setNodeAttribute(store.current().data.id, {key:'label', value: edit_name.value})
        edit_name.value = ''
        store.reload()
    }

	async function saveUserSetting(key) {
		await web.setNodeAttribute(store.current().data.id, {key: key, value: state[key]})
		state.node = await web.getNodeAttributes(route.query.node)
		store.reload()
	}

    function toggleEdit() {
        if(edit_name.value == '')
            edit_name.value = store.current().data.name
        else {
            edit_name.value = ''
        }
    }


    async function setActiveNode() {
        state.active = !state.active
        var result = await web.setNodeAttribute(store.current().data.id, {key:'_active', value: state.active})
        store.reload()
    }



</script>
