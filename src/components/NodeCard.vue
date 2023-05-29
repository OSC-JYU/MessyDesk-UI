<style>
    .disabled {
        color:gray  !important;

    }
    .disabled .node {
        border-left: solid gray 25px;
    }
    .relation-edit {
        display:none;
    }
    .relation-title {
        padding:4px;
        padding-bottom: 6px;
        border-top: solid gray 1px;
    }
    .relation-title:hover {

        background-color: #BBE3EC;
    }
    .relation-title:hover > .relation-edit {
        display:block
    }
    .form-select {
        margin-bottom:12px
    }
    .selected {
        border: solid gray 1px;
        padding: 12px;
        padding-left: 12px !important;
        background-color: #F7F7F7;
    }
    h4.relation-group {
        margin-top: 12px;
    }

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
                {{store.current().data.type_label}}
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

                <!-- <template v-else>
                    <h4 :class="['card-title', 'p-2', 'flex-grow-1', store.current().data.type]">     {{schema.result._attributes.label}}
                        <i v-if="state.editing && schema.result._attributes._active" @click="toggleEdit()" class=" bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px">
                        </i>
                        <input v-if="state.editing && edit_name" v-model="edit_name" @keyup.enter="saveLabel()"/>
                    </h4>
                </template> -->

            </div>

            <div v-if="state.editing">
                <button v-if="store.current().data.id == store.user.rid" @click="state.image_edit = !state.image_edit">change image</button>

                <button v-else-if="store.user.access != 'user'" @click="state.image_edit = !state.image_edit">change image</button>
                <!-- IMAGE UPLOAD -->
                <div v-if="state.image_edit" >
                    <div class="mb-3">
                      <label for="formFile" class="form-label">Square images works best (.jpeg or .png)</label>
                      <input class="form-control" type="file" id="image" ref="image_file">
                    </div>

                    <button @click="sendImage()" class="btn btn-primary">send image</button>
                </div>

                <!-- ACTIVE/INACTIVE SWITCH -->
                <div class="clearfix">
                    <div  v-if="store.current().data.id !== store.user.rid" class="form-check form-switch float-end">
                      <input v-model="schema.result._attributes._active" @click="setActiveNode()" class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckChecked">
                      <label class="form-check-label" for="flexSwitchCheckChecked">Active</label>
                    </div>
                </div>

                    <div class="clearfix">
                        <div style="width:120px" role="button" @click="setEdit()" class="btn btn-primary float-end" >Ready</div>
                    </div>

            </div>
            <!-- EDIT BUTTON -->
            <div v-else-if="editable()">
                <div role="button" @click="state.editing = true" class="btn btn-primary float-end" title="Edit item">
                    <i class="bi bi-pen" style="font-size: 1rem; color: white;"></i>
                </div>
            </div>




            <i v-if="!schema.result._attributes._active" class="alert alert-warning">Inactive</i>



        </div>
    

        <NodeAttributes v-if="schema.result._attributes" :editing="state.editing" :attributes="schema.result._attributes"  @reLoadData="loadData"/>

        <div :class="['card-body overflow-auto', schema.result._attributes._active ? '' : 'disabled']">

            <div v-for="(group, groupname) in schema.result.tags" :key="groupname">
                <template v-if="groupname != 'default_display'">
                    <h4 class="relation-group" v-if="state.editing">{{group.label}}</h4>
                    <h4 v-else-if="group.count !== 0">{{group.label}}</h4>
                </template>

                <div v-for="relation of group.relations" :key="relation.type" :id="group.label">
                    <!-- RELATION INFO -->
                    <!--  Show relationship only if there is data -->
                    <ol :class="['list-group', connect_editor.relation == relation ? 'selected' : '']" v-if="relation.data.length > 0">

                        <!-- editing on -->
                        <div class="relation-title" v-if="state.editing && schema.result._attributes._active">


                            <div @click="initConnectEditor(relation)" class="pointer" style="position:initial">{{relation.label}} (<b>{{relation.target_label}}</b>)<i  class="float-end bi bi-pen" ></i></div>
                            <div v-if="connect_editor.relation == relation">
                                <div>

                                    <select class="form-select" v-model="state.selected" @change="createConnection(relation)">
                                        <option></option>
                                        <option v-for="row of connect_editor.data" :value="row.value">
                                            {{row.text}}
                                        </option>
                                    </select>

                                    <div v-if="store.user.access != 'user' || relation.target_publicity" @click="initNodeCreator(relation)" title="lisää node" type="button" class="btn btn-primary float-end">
                                        <i :title="'create ' + relation.target_label" class="float-end bi bi-plus-circle pointer" style="font-size: 1rem; color: white;"></i>
                                    </div>

                                </div>

                            </div>
                        </div>

                        <div v-else>
                            <div style="position:initial">{{relation.label}} (<b>{{relation.target_label}}</b>)</div>
                        </div>

                        <!-- editing on ends -->

                        <!-- LIST RELATION DATA -->
                        <li class="list-group-item d-flex justify-content-between align-items-start border-0" v-for="node in relation.data" :key="node.label">
                            <div :class="['me-auto', node.rel_active ? 'active' : 'disabled']">

                                <div @click="select(node.type, node.id)" :class="['node',node.type, 'pointer']">
                                    {{node.label}}
                                </div>

                                <!-- INFO -->
                                <div class="rel-info" v-if="!state.editing && node.rel_attr">
                                    <i>{{node.rel_attr}}</i>
                                </div>

                                <!-- RELATIONSHIP ATTRIBUTE editor (info) -->
                                <template v-if="state.editing && state.active">
                                    <div v-if="node.rel_attr">{{node.rel_attr}}
                                        <i @click="connect_editor.current_rel_id = node.rel_id; connect_editor.current_rel_attr = node.rel_attr" class=" bi bi-pen pointer" style="font-size: 0.7rem; color: blue;margin-left:10px">
                                        </i>
                                    </div>

                                    <div v-else>
                                        <i>info</i>
                                        <i @click="connect_editor.current_rel_id = node.rel_id" class=" bi bi-pen pointer" style="font-size: 0.7rem; color: blue;margin-left:10px">
                                        </i>
                                    </div>
                                </template>

                                <div v-if="state.editing && connect_editor.current_rel_id == node.rel_id">
                                    <textarea  v-model="node.rel_attr" rows="3" cols="30"></textarea><br>

                                    <button @click="connect_editor.current_rel_id = ''; node.rel_attr = connect_editor.current_rel_attr" class="btn btn-secondary">peru</button>

                                    <button @click="saveRelationAttribute(node.rel_attr)" class="btn btn-primary">tallenna</button>
                                </div>
                                <!-- RELATIONSHIP ATTRIBUTE editor ENDS  -->

                            </div>
                            <!-- ACTIVE/INACTIVE LINK TOGGLE-->
                            <div v-if="state.editing && schema.result._attributes._active && connect_editor.relation == relation" class="form-check form-switch">

                              <input @click="setActiveLink(node)" v-model="node.rel_active" class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckChecked" checked>
                              <label class="form-check-label" for="flexSwitchCheckChecked"></label>
                              <i @click="removeConnection(node.rel_id)" class="float-end bi-x-circle pointer"></i>
                            </div>

                            <!-- FIT map to item on QueryMap -->
                            <div v-if="schema.result._attributes._active && store.current_node.data.type == 'QueryMap'" class="form-check form-switch ">
                                    <i @click="fitGraph(store.current_node.data.id, node.id)" class="bi bi-geo-alt-fill float-end text-primary pointer fs-5"></i>
                            </div>

                            <div v-if="state.editing && schema.result._attributes._active && node.type == 'QueryMap' && connect_editor.relation == relation" class="form-check form-switch ">
                                    <i title="muuta sijaintia" @click="openMapPositionEditor(node.id, node.rel_id)" class="bi bi-geo-alt-fill float-end text-primary pointer fs-5"></i>
                            </div>

                            <!-- Map location without coordinates -->
                            <div v-if="state.editing && schema.result._attributes._active && node.type == 'QueryMap' && !node.rel_x" class="form-check form-switch ">
                                    <button @click="openMapPositionEditor(node.id, node.rel_id)" class="bi bi-geo-alt-fill float-end btn btn-danger pointer fs-5">aseta sijainti</button>
                            </div>


                            <!-- <i v-if="state.editing" @click="removeConnection(node.rel_id)" class="float-end bi-x-circle pointer"></i> -->

                        </li>
                    </ol>


                    <!-- editing on -->
                    <div class="relation-title" v-else-if="state.editing && schema.result._attributes._active">

                        <div @click="initConnectEditor(relation)"  class="pointer" style="position:initial">{{relation.label}} (<b>{{relation.target_label}}</b>)
                            <i  class="float-end bi bi-pen" ></i>
                        </div>
                        <div style="margin-bottom:60px" v-if="connect_editor.relation == relation">
                            <div>

                                <select class="form-select" v-model="state.selected" @change="createConnection(relation)">
                                    <option></option>
                                    <option v-for="row of connect_editor.data" :value="row.value">
                                        {{row.text}}
                                    </option>
                                </select>

                                <div v-if="store.user.access != 'user' || relation.target_publicity" @click="initNodeCreator(relation)" title="lisää node" type="button" class="btn btn-primary float-end" >
                                    <i :title="'create ' + relation.target_label" class="float-end bi bi-plus-circle pointer" style="font-size: 1rem; color: white;"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- DELETE BUTTON -->
            <div class="float-end" style="margin-top:50px" v-if="state.editing  && store.user.access !== 'user' && store.current().data.id !== store.user.rid">
                <button @click="store.node_deleter_open = true" class="btn btn-danger" title="delete item"><i class="bi bi-trash"></i></button>
            </div>

        </div>
        <div class="card-footer">
            <div v-if="!route.query.map" class="btn-group" role="group" >
                <!--<button class="btn" @click="setGraphOptions('cose')">cose</button>-->
                <button class="btn" title="layout cose" @click="$emit('setGraphOptions', 'cose')">A1</button>
                <button class="btn" title="layout cola" @click="$emit('setGraphOptions', 'cola')">A2</button>
                <button class="btn" title="layout fcose" @click="$emit('setGraphOptions', 'fcose')">A3</button>
                <button class="btn" title="layout grid" @click="$emit('setGraphOptions', 'grid')">grid</button>
                <button class="btn" title="oma asettelu" @click="$emit('setGraphOptions', 'preset')">my</button><br>
                <button @click="$emit('saveLayout')" class="btn btn-secondary" title="save layout"><i class="bi bi-snow"></i></button>
            </div>

            <!-- USER GROUPS & ADMIN STUFF -->
			<!-- one cannot set ones own permissions -->
			<template v-if="state.admin_edit">

				<div class="card border-danger" v-if="store.current().data.type == 'Person' && store.user.access == 'admin'">

					<div class="card-header">
						User settings
					</div>
					<div class="card-body">
						<h5>User group (visibility group)</h5>
						<select @change="saveUserSetting('_group')" class="form-select" aria-label="Default select example" v-model="state._group">

							<option v-for="group in store.groups" :key="group.id" :value="group.id">
								{{group.label}}
							</option>
						</select>

                        <h5>User Permissions</h5>
                        <div v-if="store.current().data.id !== store.user.rid">
    						<select @change="saveUserSetting('_access')" class="form-select" aria-label="Default select example" v-model="state._access">
    							<option v-for="permission of permissions" :key="permission" :value="permission">
    								{{permission}}
    							</option>
    						</select>
                        </div>
                        <div v-else>
                            Can't set your own access level.
                        </div>
					</div>
				</div>
			</template>
			<!-- USER GROUPS & ADMIN STUFF ENDS -->


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

    function initNodeCreator(relation) {
        store.new_node_type = relation.target
        store.new_node_label = relation.target_label
        store.new_node_relation = relation
        store.node_creator_open = true
    }

    async function initConnectEditor(relation) {
        if(connect_editor.relation == relation) {
            connect_editor.relation = null
            connect_editor.data = []
            return
        }
        connect_editor.relation = relation
        var result = await web.getListOfNonConnected(relation.target, relation.type, route.query.node)
        connect_editor.data = result.data
    }

    async function select(type, id) {
        id = id.replace('#', '')
        // if we click map, then open map in map view
        if(type == 'QueryMap') {
            router.push({ name: 'graph', query: { map: id } })
            // if we are in map view, then zoom to clicked item
        } else if (route.query.map) {
            emit('fitGraph', id)
            router.push({ name: 'graph', query: { map: route.query.map, focus: id } })
        } else {
            router.push({ name: 'graph', query: { node: id } })
        }
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

    async function setActiveLink(relation) {
        relation.rel_active = !relation.rel_active
        var result = await web.setRelationAttribute(relation.rel_id, {name:'_active', value: relation.rel_active})
        store.reload()
    }

    async function setActiveNode() {
        state.active = !state.active
        var result = await web.setNodeAttribute(store.current().data.id, {key:'_active', value: state.active})
        store.reload()
    }

    async function saveRelationAttribute(attr_value) {
        var result = await web.setRelationAttribute(connect_editor.current_rel_id, {name:'attr', value: attr_value})
        connect_editor.current_rel_id = 0
        connect_editor.current_rel_attr = ''
    }

    async function createConnection(relation) {
        var to = state.selected
        if(relation.reverse)
            await web.connect(to, relation.type, route.query.node)
        else
            await web.connect(route.query.node, relation.type, to)

        store.reload()
    }

    async function removeConnection(rid) {
        await web.removeEdgeByRID(rid)
        store.reload()
    }

    function openMapPositionEditor(map_rid, rel_rid) {
        router.push({ name: 'maps', query: { map: map_rid.replace('#', ''), focus: route.query.node, relation: rel_rid.replace('#', '') } })
    }


</script>
