


<template>

        <div v-if="store.current_node && store.current_node.data && store.current_node.data.type && route.query.node" class="card" >
            <div class="card-header">

                Schema ID: {{store.current().data.type}}
                <div class="d-flex bd-highlight">
                    <h4 :class="['card-title', 'p-2', 'flex-grow-1', store.current().data.type]"> {{store.current().data.name}}
                        <i v-if="state.editing" @click="toggleLabelEdit()" class="bi bi-pen pointer" style="font-size: 0.9rem; color: blue;margin-left:10px" >
                        </i>
                        <input v-if="state.editing && state.label" v-model="state.label" @keyup.enter="saveNodeAttribute('label')"/>
                    </h4>

                    <!-- EDIT BUTTON -->
                    <div v-if="state.editing">
                        <div role="button" @click="toggleEdit()" class="btn btn-primary float-end">Ready</div>

                    </div>
                    <div v-else-if="editable()" class="float-end">
                        <div role="button" @click="state.editing = true" class="btn btn-primary " >
                            <i class="bi bi-pen" style="font-size: 1rem; color: white;"></i>
                        </div>
                    </div>
                </div>

            </div>

            <div class="card-body overflow-auto">

                <SchemaAttributeEditor :editing="state.editing" class="mb-5"/>

                <h4 class="card-title">Relations</h4>
                <ol class="list-group" v-if="schema.result.data">
                    <li class="list-group-item d-flex justify-content-between align-items-start" v-for="relation in schema.result.data.result" :key="relation.type">

                        <div >
                            <!-- INCOMING -->
                            <template v-if="relation.direction == 'incoming'">
                                <div @click="select(relation.target_id)" style="font-weight:normal" :class="['node',relation.target, 'pointer']">
                                    <span>{{relation.label_rev}}</span>
                                    <i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
                                    <span ><b>{{relation.target}}</b></span>
                                    <i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
                                    {{relation.label}}
                                </div>
                                <template v-if="Array.isArray(relation.tags)">
                                    <span v-for="tag in relation.tags" class="badge bg-secondary"> {{tag}}</span>
                                </template>
                                <span v-else-if="relation.tags.trim() != 'cypher.null'" class="badge bg-secondary"> {{relation.tags}}</span>

                            </template>

                            <!-- OUTGOING -->
                            <template v-else>
                                <div @click="select(relation.target_id)" style="font-weight:normal" :class="['node',relation.target, 'pointer']">
                                    {{relation.label}}
                                    <i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
                                    <span><b>{{relation.target}}</b></span>
                                    <i class="bi bi-arrow-right-short" style="font-size: 1rem; color: blue;"></i>
                                    <span>{{relation.label_rev}}</span>
                                </div>
                                <template v-if="Array.isArray(relation.tags)">
                                    <span v-for="tag in relation.tags" class="badge bg-secondary"> {{tag}}</span>
                                </template>
                                <span v-else-if="relation.tags.trim() != 'cypher.null'" class="badge bg-secondary"> {{relation.tags}}</span>

                            </template>

                        </div>

                        <span v-if="state.editing">
                            <i @click="editor.current_rel={...relation}" class="bi bi-pen pointer" style="font-size: 1rem; color: blue;margin-left:10px" data-bs-toggle="offcanvas" data-bs-target="#schemaRelationEditor"></i>
                        </span>

                    </li>
                </ol>

                <!-- ADD SCHEMA RELATION button -->
                <a @click="editor.current_rel=''" href="#" data-bs-toggle="offcanvas" data-bs-target="#schemaRelationEditor" title="lisää liitos">
                    <i v-if="state.editing"  class="float-end bi bi-node-plus-fill" style="font-size: 2rem; color: cornflowerblue;margin-right:10px; margin-top:10px"></i>
                </a>


            </div>



            <RelationCreator :editor="editor"/>
        </div>

        <div v-else class="card">
            <div class="card-header">
                <div>KuKaKo</div>
                <h4>Schema</h4>
            </div>
            <div class="card-body">
                <p><b>Schema</b> is a special graph which defines what nodes are available and how they can be linked together.</p>
                <p class="alert alert-info">Double click any node to see and edit node's relationships.</p>
            </div>

            <div v-if="store.user && store.user.access == 'admin'" class="card-footer">
                <div class="btn-group" role="group" >
                    <!--<button class="btn" @click="setGraphOptions('cose')">cose</button>-->
                    <button class="btn" title="layout cose" @click="$emit('setGraphOptions', 'cose')">A1</button>
                    <button class="btn" title="layout cola" @click="$emit('setGraphOptions', 'cola')">A2</button>
                    <button class="btn" title="layout fcose" @click="$emit('setGraphOptions', 'fcose')">A3</button>
                    <button class="btn" title="layout grid" @click="$emit('setGraphOptions', 'grid')">grid</button>
                    <button @click="$emit('saveLayout')" class="btn btn-primary" title="talleta asettelu KAIKILLE käyttäjille"> save PUBLIC layout</button>
                </div>


                    <div v-if="store.user">{{store.user.id}} : {{store.user.group}} : {{store.user.access}}</div>
            </div>
        </div>



</template>




<script setup>
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
    import SchemaAttributeEditor from './SchemaAttributeEditor.vue'
    import RelationCreator from './SchemaRelationCreator.vue'
    import {store} from "./Store.js";
    import web from "../web.js";

    const route  = useRoute();
    const router = useRouter();

    var graph = reactive({result:[]})
    var schema = reactive({result:[]})
    var me = reactive({data:{}})
    var state = reactive({label:'', editing: false})
    var add_new = reactive({type:'', label:''})
    var created = reactive([])
    var editor = reactive({
        current_rel: '',

    })

    const emit = defineEmits(['setGraphOptions','saveLayout'])

    onMounted(async()=> {
        if(route.query.node)
            reset()
            schema.result = await web.getSchemaLinks(route.query.node)

    })

    watch(
      () => route.query.node,
      async (newValue, oldValue) => {
          console.log('query node changed')
          reset()
          schema.result = await web.getSchemaLinks(route.query.node)
    })

    watch(
      () => store.update,
      async (newValue, oldValue) => {
          //reset()
            schema.result = await web.getSchemaLinks(route.query.node)

    })

    function editable() {
        if(store.current().data.id == '#' + route.query.node) {
            if(store.user.access == 'admin')
                return true
        }
        return false
    }

    function toggleEdit() {
        reset()
        if(state.editing)
            state.editing = false
        else {
            state.editing = true
        }
    }

    function reset() {
        editor.current_rel = ''
        editor.relation = {data:[]}
    }

    function toggleLabelEdit() {
        if(state.label == '')
            state.label = store.current().data.name
        else {
            state.label = ''
        }
    }

    async function initConnectEditor(relation) {
        connect_editor.relation = relation
        var result = await web.getListOfNonConnected(relation.target, relation.type, route.query.node)
        connect_editor.data = result.data
    }

    async function select(id) {
        router.push({ name: 'schema', query: { node: id.replace('#', '') } })
    }

    async function saveNodeAttribute(attr_name) {
        var result = await web.setNodeAttribute(store.current().data.id, {key:attr_name, value: state.label})
        state.label = ''
        store.reload()
    }




</script>
