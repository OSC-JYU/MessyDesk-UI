<style>

    @import '@vue-flow/core/dist/style.css';

    .graph {
        background-color: white;
    }
    #container {
        height: 100%
    }
	.schema {
		background-color: #96b6d9;
	}
    .sidecard {
        min-width: 220px;
    }
    .offcanvas-bottom {
        height:50% !important;
    }

    .graph-display { 

    background: rgb(94,94,110);
    background: linear-gradient(0deg, rgba(94,94,110,0.8463585263206845) 0%, rgba(129,159,176,0.5508404045211834) 7%, rgba(69,130,159,0) 100%);
    -webkit-background-size: cover;
    -moz-background-size: cover;
    -o-background-size: cover;
    background-size: cover;
    width: 100%;
    height: 100%;
    }

    .set-panel {
        max-height: 500px !important;
      
    }

    .vue-flow__edge-path, .vue-flow__connection-path {
        stroke-width: 4;
    }

</style>

<template>
 

 <v-container id="container" class="w-100 p-0 m-0 no-gutters">
		<v-row class="h-100 p-0 h-0" >


			<v-col class="p-0">
                
                <div class="graph-display">
                    <v-btn @click="addDemoNode()">sd</v-btn>
                   
                    <!-- set panel -->
                    <v-navigation-drawer  v-if="store.current_node" v-model="state.setPanel" temporary location="bottom" >

                        <v-toolbar color="#005757" density="compact">
                        <template v-slot:prepend>
                            <v-app-bar-nav-icon></v-app-bar-nav-icon>
                        </template>

                        <v-toolbar-title>
                            <v-icon size="35" color="green">mdi-folder-outline</v-icon>
                            {{ store.current_node.data.label }}
                        </v-toolbar-title>
                        </v-toolbar>

                        <!-- <v-btn 
                            @click="store.uploader_open = true"
                            >
                            <template v-slot:prepend>
                                <v-icon  icon="mdi-file"></v-icon>
                            </template>
                        
                                Add file to set
                        </v-btn> -->

                        <v-divider></v-divider>

                        <v-row class="set-panel">
                            <v-col
                            v-for="file in state.setdata"
                            :key="file.id"
                            class="d-flex child-flex flow"
                            cols="2"
                            >

                            <v-card
                                class="mx-auto"
                                
                            >
                                <v-img
                                class="align-end text-white"
                                width="200"
                                :src="file.thumb"
                                cover
                                >
                                <v-card-title>{{ file.label }}</v-card-title>
                                </v-img>

                                <v-card-subtitle class="pt-4">
                                Image
                                </v-card-subtitle>

                                <v-card-text>
                                <div> {{ file.description }}</div>

                                </v-card-text>

                                <v-card-actions>

                                <v-switch v-model="file.expand" @change="expandSetNode(file)" label="Show in Desk" color="primary">expand</v-switch>
                                </v-card-actions>
                            </v-card>

                            </v-col>
                        </v-row>



                        <!-- <div v-for="file in state.setdata" class="col w-200 shadow-1-strong rounded mb-4">
                            <div class="card">
                                <img :src="file.thumb" :alt="file.label" class="image" />
                                <div class="m-2">
                                    {{ file.label }}
                                    <div class="form-check form-switch">
                                        <input @change="expandSetNode(file, store.current_node.id)" class="form-check-input" type="checkbox" role="switch" :id="file['@rid']">
                                        <label class="form-check-label" :for="file['@rid']">Show in Desk</label>
                                    </div>
                                </div>
                            </div>
                        </div> -->


                    </v-navigation-drawer>

                    <!-- <VueFlow :nodes="elements.nodes" :edges="elements.edges" fit-view-on-init > -->
                    <VueFlow :nodes="elements.nodes" :edges="elements.edges" >
                        <Background />
                        <template #node-project="{ data }">
                            <ProjectNode :data="data" />
                        </template>

                        <template #node-image="{ data }">
                            <ImageNode :data="data" />
                        </template>

                        <template #node-process="{ data }">
                            <ProcessingNode :data="data" />
                        </template>

                        <template #node-setprocess="{ data }">
                            <SetProcessingNode :data="data" />
                        </template>

                        <template #node-pdf="{ data }">
                            <PDFNode :data="data" />
                        </template>

                        <template #node-text="{ data }">
                            <TextNode :data="data" />
                        </template>
         
                        <template #node-data="{ data }">
                            <JSONNode :data="data" />
                        </template>

                        <template #node-set="{ data }">
                            <SetNode :data="data" />
                        </template>

                        <template #node-human.json="{ data }">
                            <HumanNode :data="data" />
                        </template>

                        <template #node-ner.json="{ data }">
                            <NERNode :data="data" />
                        </template>

                        <template #node-osd.json="{ data }">
                            <OSDNode :data="data" />
                        </template>

                        <template #node-empty="{ data }">
                            <EmptyNode :data="data" />
                        </template>
                        
                        <Background />

                        </VueFlow>  
                        <template v-if="props && props.mode == 'graph'">
                            <v-icon  style="position: absolute; bottom: 10px; right: 30px;" @click="layoutGraph('LR')" title="original files only"  size="25" >mdi-root</v-icon>
                            <v-icon  style="position: absolute; bottom: 10px; right: 30px;" @click="layoutGraph('LR')" title="order left to right"  size="25" >mdi-arrow-right-box</v-icon>
                            <v-icon  style="position: absolute; bottom: 10px; right: 00px;" @click="layoutGraph('TB')" title="order to top down"  size="25" >mdi-arrow-down-box</v-icon>
                        </template>
                </div>
			</v-col>

		</v-row>

 </v-container>

  
</template>


<script setup>

    import { onMounted, watch, reactive, ref, nextTick } from "vue";
    import web from "../web.js";

    import {store} from "./Store.js";
    //import {getLayoutSettings} from "./GraphOptions.js";
    import { useRouter, useRoute } from 'vue-router'

    import { Position, VueFlow, defaultNodeTypes, useVueFlow } from '@vue-flow/core'
    import { Background } from '@vue-flow/background'
    const { updateNode } = useVueFlow()

    //const { getNode, onNodeClick, onNodeDoubleClick, onNodeDragStop} = useVueFlow()
    const flow = useVueFlow({
        defaultZoom: 0.5,
        maxZoom: 4,
        minZoom: 0.1,
    })

    import ImageNode from './nodes/ImageNode.vue'
    import ProjectNode from './nodes/ProjectNode.vue'
    import ProcessingNode from './nodes/ProcessingNode.vue'
    import SetProcessingNode from './nodes/SetProcessingNode.vue'
    import PDFNode from './nodes/PDFNode.vue'
    import TextNode from './nodes/TextNode.vue'
    import SetNode from './nodes/SetNode.vue'
    import JSONNode from './nodes/JSONNode.vue'
    import OSDNode from './nodes/OSDNode.vue'
    import HumanNode from './nodes/HumanNode.vue'
    import NERNode from './nodes/NERNode.vue'
    import EmptyNode from './nodes/EmptyNode.vue'

    import { useShuffle } from './useShuffle'
    import { useLayout } from './useLayout'
    import Icon from './Icon.vue'
    import { id } from "vuetify/locale";

    // import * as bootstrap from "bootstrap/dist/js/bootstrap"
    //import * as bootstrap from 'bootstrap';
    //import { el } from "vuetify/locale";
    
    //window.bootstrap = bootstrap;

    const { graph_dagre, layout, previousDirection } = useLayout()

    const elements = reactive({nodes: [], edges:[]})

    const emit = defineEmits(['open-node'])


	const CLUSTER = 1

    const route  = useRoute();
    const router = useRouter();

	const offCanvasSet = ref(null)
    var settable = ref(null)
    var state = reactive({setdata:[], setPanel: false, rootNodes:[], node_added: 0, node_updated: 0})

    var current_node = reactive({})
    var current_graph_node = reactive({position: {}})
    var graph = reactive({result:[]})
    var schema = reactive({result:[]})
	var tags = reactive({result:[]})
    var me = reactive({data:{}})
    var editing = ref(false)

    // Websocket for UI updates
    let connection = new WebSocket('ws://localhost:8200/ws');
    connection.onmessage = (event) => {
        console.log('tuli message')
        console.log(event)
        try {
            var wsdata = JSON.parse(event.data)
            if(wsdata.target) {
                console.log('got message:', wsdata.command)
                if(wsdata.command == 'add') {
                    addNode(wsdata)
                } else if (wsdata.command == 'update') {
                    if(state.setPanel) loadSet()  // update set panel if open

                    console.log('updating ', wsdata.target)
                    var target_node = elements.nodes.find(x => x.id == wsdata.target)
                    if(target_node) {
                        if(wsdata.image) target_node.data.image = wsdata.image
                        if(wsdata.description) target_node.data.description = wsdata.description
                        if(wsdata.count) target_node.data.count = wsdata.count
                    }
                    // stop processing animation from process node
                    if(wsdata.process) {
                        console.log('----------------------- wsdata.process', wsdata.process)
                        var process_node = elements.nodes.find(x => x.id == wsdata.process)
                        if(process_node) {
                            process_node.data.image = ''
                        } 
                    }

                }
            } else {
                if(wsdata.command == 'add') {
                    addNode(wsdata)
                }
            }
        } catch(e) {
            console.log('WS error', e)
            console.log(event.data)
        }
    }
    // Websocket for UI updates ends


    connection.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };

    const props = defineProps({
        mode: '',
        fit: {type: String, default: false}
    })
    

    flow.onNodeDragStop((event) => {
        store.current_node = event.node
        console.log(event.node.position)
        event.node.position = {x:Math.round(event.node.position.x/100, 10)*100, y:Math.round(event.node.position.y/100, 10)*100}
        connection.send(JSON.stringify({id:event.node.id, position:event.node.position}))
    })


    flow.onNodeClick((event) => {
        console.log(event.node)
        store.current_node = event.node
        //store.view = flow.getViewport()
    })

    flow.onPaneClick((event) => {
        store.current_node = null
    })

    // here is the place to fit to node
    flow.onNodesInitialized ((event) => {
        console.log('onNode initialized')

        // set is created
        if(store.update_data) {
            console.log('update data', store.update_data)
            fitToNode(store.update_data.id)

        // restore view to stored viewport
        } else {
            // if(!state.node_added) {
            //     console.log('no reorder target')
            //     if(props.mode == "graph") {
            //         // we coming back from double click and the graph was not in order
            //         if(store.reorder_target) {
            //             fitToNode(store.reorder_target,1)
            //             store.reorder_target = null
            //         // we are coming back from double click and the graph was in order
            //         } else if(store.view) {
            //             flow.setViewport(store.view)

            //         } else flow.fitView()
            //     }
                
            //     if(props.mode == "graph") getRootNodes()

            // // node is added
            // } else {
                // console.log('reorder target', store.reorder_target)
                // if(state.node_added) fitToNode(state.node_added)
                // else fitToNode(store.reorder_target)

                // store.reorder_target = state.node_added
                // state.node_added = 0
                //store.view = flow.getViewport()
           // }
        }


    })



    flow.onMoveEnd ((event) => {
        if(props.mode == "graph") store.view = flow.getViewport()
        
    })


    flow.onNodeDoubleClick((event) => {
        store.current_node = event.node
        
 
        console.log(event.node.data.type)
        if(event.node.type == "project" ) {
            store.view = null
            if(store.current_node) store.current_project = store.current_node
            router.push({ name: 'graph', query: { node: event.node.id.replace('#', '')} })
        } else if(event.node.type == "set") {
            //state.setPanel = true
            toggleSetPanel()
        } else if(event.node.data.type == "file") {
            // find source file and cruncher of this file
            let cruncher, source 
            const parent = flow.getIncomers(event.node)
            if(parent.length == 1) {
                cruncher = parent[0].id.replace('#', '')
                const granparent = flow.getIncomers(parent[0])
                if(granparent.length == 1) {
                    source = granparent[0].id.replace('#', '')
                }
            }
            emit('open-node', event.node.id, source)
            // if(cruncher && source)
            //     router.push({ name: 'files', params: { rid: event.node.id.replace('#', '')}, query: {cruncher:cruncher, source:source} })
            // else
            //     router.push({ name: 'files', params: { rid: event.node.id.replace('#', '')} })
        }
           
    })



    //
	watch(
    	() => route.query,
    	async (newValue, oldValue) => {

			if(newValue.node || newValue.type || newValue.tag || newValue.query || newValue.map) {
                console.log('GraphDisplay: route.path: ' + route.path)
    			console.log('GraphDisplay: on route.query: newValue')
    			if(newValue) console.log(Object.keys(newValue))
    			console.log('GraphDisplay: on route.query: oldValue')
    			if (oldValue) console.log(oldValue)

                if(newValue.map && oldValue.map && newValue.map == oldValue.map) {

                } else {
                    loadGraph(route, oldValue)
                }

			} else {
                console.log('Wait for route change...')
                //initView()
            }

	})

    // watch /list changes

    watch(
    	() => props.fit,
      	async (newValue, oldValue) => {
            if(newValue) fitToNode(newValue.split('-')[0])
    })

    watch(
    	() => route.params,
      	async (newValue, oldValue) => {
        	loadGraph(route, oldValue)
    })

    watch(
    	() => store.update,
      	async (newValue, oldValue) => {
            console.log(store.update_data)
            //if(store.update_data) updateGraphNode(store.update_data)
        	//else loadGraph(route, oldValue)
            loadGraph(route, oldValue)
    })

    async function layoutGraph(direction) {

        //nodes.value = layout(nodes.value, edges.value, direction)
        elements.nodes = layout(elements.nodes, elements.edges, direction)

        // nextTick(() => {
        //     flow.fitView()
        // })
    }

    async function fitToNode(id, padding) {
        console.log('done fitToNode', id)
        var node = elements.nodes.find(x => x.id == id)
        store.current_node = node
        if(!padding) padding = 3
        flow.fitView({nodes: [id], duration: 1000, padding: padding})
       
    }

    async function getRootNodes() {
        store.root_nodes = []
        for(var node of elements.nodes) {
            const parent = flow.getIncomers(node)
            if(parent.length == 1) {
                
            } else {
                store.root_nodes.push(node)
               // var outs = flow.getOutgoers(node)
               // for(var out of outs) {
                //    updateNode(out.id, {hidden: true})
               // }
                //node.data.hidden = true
                //updateNode(node.id, {hidden: true})
            }
        }
    }

    async function toggleSetPanel(node) {
        state.setdata = await web.getSetFiles(store.current_node.id)
        state.setPanel = true
    }

    async function loadSet() {
        state.setdata = await web.getSetFiles(store.current_node.id)
    }

    function updateGraphNode(update) {

        console.log('updateGraphNode', update)

        var target_node = elements.nodes.find(x => x.id == update.id)
        if(target_node) {
            if(update.name) {
                target_node.data.label = update.name
            }
        }
    }

    function addDemoNode() {
        var int = Math.floor(Math.random() * 100)
        const id = 'demo-' + int
        const newNode = {
            id: 'demo',
            node: { type: 'Image', label: 'demo', '@type': 'File', id: id },
            target: '#264:310',
            source: id,
            type: 'image',
            position: { x: Math.random() * 100, y: Math.random() * 100 }
        }
        addNode(newNode)
        layoutGraph('LR')
    }

    function addNode(wsdata) {
        console.log('adding node')
        console.log(wsdata.target)
        console.log(wsdata.node)
        // file uploaded to set is not added to visual graph
        if(wsdata.set) {
           // expandSetNode(wsdata.node, wsdata.target)
        } else {
            const id = wsdata.node['@rid'] || wsdata.node.rid || wsdata.node.id
            const nodetype = wsdata.node['@type'] || wsdata.node.type
            wsdata.node.type = wsdata.node['@type'].toLowerCase() // "File" -> "file"
            wsdata.node.image = wsdata.image
            const newNode = {
                id: id,
                data: wsdata.node,
                image: wsdata.image,
                type: wsdata.type,
                position: { x: Math.random() * flow.dimensions.value.width, y: Math.random() * flow.dimensions.value.height },
        }
        
        console.log('adding node', newNode)
        console.log('to node ', wsdata.target)
        elements.nodes.push(newNode)
        console.log(`source: ${wsdata.target}, target: ${id}`)
        state.node_added = id
        if(wsdata.target)
            elements.edges.push({id:Math.random() + 'edge', source: wsdata.target, target: id})
        console.log('calling layout graph')
    }
    layoutGraph('LR')
    

        // stop processing animation from process node
        // if(wsdata.type != 'process') {
        //     var target_node = elements.nodes.find(x => x.id == wsdata.target)
        //     if(target_node) {
        //         target_node.data.image = ''
        //     }            
        // }
    }

    async function expandSetNode(node) {

        await web.setNodeAttribute(node['@rid'], {key: 'expand', value: node.expand })
        loadGraph()

    }

	async function loadGraph() {
        console.log('loading graph')
		var layout = ''
        graph.result.data = {}

         if(route.query.node) {

            graph.result.data = await web.getProject(route.query.node)
      
        } else {
            await loadProjects()
        }

        drawGraph()
        

	}


    async function drawGraph() {


        var positions = await getNodePositions()
        //console.log(positions)

        elements.nodes = []
        elements.edges = []

        for(var node of graph.result.data.nodes) {
  
            var flownode = {
                id: node.data.id, 
                type: node.data.type.toLowerCase(),
                data: {
                    type: node.data.type.toLowerCase(),
                    label: node.data.name,
                    description: node.data.description,
                    paths: node.data.paths,
                    info: node.data.info,
                    file_count: node.data.file_count,
                    count: node.data.count,
                    roi_count: node.data.roi_count
                }
            }
            if(node.data._type)
                flownode.type = node.data._type.toLowerCase()

            if(positions && positions[node.data.id]) {
                flownode.position = positions[node.data.id]
            } else {
                flownode.position = getDefaultPosition()
            }

            if(node.data.image) 
                flownode.data.image = node.data.image

            elements.nodes.push(flownode)
        }

        for(var node of graph.result.data.edges) {
            var flowedge = {
                id: node.data.id, 
                source: node.data.source,
                target: node.data.target
            }

            elements.edges.push(flowedge)
        }
        
        if(elements.nodes.length === 0) {   
        
            elements.nodes.push({
                id: '1',
                type: 'empty',
                position: { x: 0, y: 0 },
                data: {
                    type: 'empty',
                    label: 'Your Desk is empty!',}
                })
            }
        

        if(props.mode !== 'projects')
            layoutGraph('LR')

    }

    function getDefaultPosition() {
        return {x: 0, y: 0}
    }



    async function getNodePositions() {
        // for Desks view
        if(props.mode == 'projects') {
            var node_layout = await web.getLayoutByTarget(props.mode)
            return node_layout
        }

        return 0
    }


    async function loadProjects() {
        store.current_project = null
        graph.result.data = {nodes: [], edges:[]}
        graph.result.data.nodes = await web.getProjects()
        store.projects = graph.result.data.nodes
        // convert projects to graph format
        for(var node of graph.result.data.nodes) {
            node.data = {id:node['@rid']}
            node.data.name = node.label
            node.data.type = node['@type']
            node.data.file_count = node.file_count + ' files'
            node.data.paths = node.paths
            node.data.info = node.info
            node.data.description = node.description
        }
        
    }


	async function initView() {

        store.root_nodes = []
        if(!store.user) store.user = await web.getMe()
        

		if(!props.mode && route.path == '/' ) {
			router.push({ name: 'graph', query: {}})

		} else if(props.mode == 'graph') {

			if(route.query.node || route.query.type || route.query.query) {
				loadGraph(route)
			} 

		} else if(props.mode == 'projects') {
            await loadProjects()
            drawGraph('fcose', route)
        }
	}


	onMounted(async()=> {
		initView()
        console.log(import.meta.env.VITE_PUBLIC_PATH)
	})


</script>
