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

    .process-panel,
.layout-panel {
  display: flex;
  gap: 10px;
  z-index: 10000;
}


    .process-panel {
  background-color: #2d3748;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.process-panel button {
  border: none;
  cursor: pointer;
  background-color: #4a5568;
  border-radius: 8px;
  color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}

.process-panel button {
  font-size: 16px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-panel {
  display: flex;
  align-items: center;
  gap: 10px;
}

.process-panel button:hover,
.layout-panel button:hover {
  background-color: #2563eb;
  transition: background-color 0.2s;
}

.process-panel label {
  color: white;
  font-size: 12px;
}
.graph-display { 
  background: url(images/bg.jpg) no-repeat center center fixed; 
  background: rgb(94,94,110);
background: linear-gradient(0deg, rgba(94,94,110,0.8463585263206845) 0%, rgba(129,159,176,0.5508404045211834) 7%, rgba(69,130,159,0) 100%);
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  width: 100%;
  height: 100%;
}

</style>

<template>
 

 <div id="container" >
		<div class="row h-100" >
			<div class="col-9 px-0">
                <div class="graph-display">
                    <VueFlow :nodes="elements.nodes" :edges="elements.edges"  >
                        <template #node-project="{ data }">
                            <ProjectNode :data="data" />
                        </template>

                        <template #node-image="{ data }">
                            <ImageNode :data="data" />
                        </template>

                        <template #node-process="{ data }">
                            <ProcessingNode :data="data" />
                        </template>

                        <template #node-pdf="{ data }">
                            <PDFNode :data="data" />
                        </template>

                        <template #node-text="{ data }">
                            <TextNode :data="data" />
                        </template>
                        
                        <template #node-set="{ data }">
                            <SetNode :data="data" />
                        </template>

                        <Background />

                        <Panel class="process-panel" position="top-right">
                            <div class="layout-panel">

                            <button title="set horizontal layout" @click="layoutGraph('LR')">
                                <Icon name="horizontal" />
                            </button>

                            <button title="set vertical layout" @click="layoutGraph('TB')">
                                <Icon name="vertical" />
                            </button>
                            <button v-if="store.current_node" title="DEBUG: add node" @click="addNode({rid: Math.random() + 'p', type: 'process', position: { x: 100, y: 100 }}, store.current_node.id)">
                                <Icon name="plus" />   <i class="fs-5 bi-plus-circle"></i>
                            </button>
                            <span v-if="store.current_node" style="color:white" >{{ store.current_node.data.label }}</span>
                            </div>
                        </Panel>
                    </VueFlow>  
                </div>
			</div>

            <div class="col-3 sidebar p-0 h-100">
            
                <NodeCard v-if="props.mode == 'graph'" @setGraphOptions="setGraphOptions" @saveLayout="saveLayout" @fitGraph="fitGraph" class="h-100 w-100 position-absolute"/>
                <ProjectCard v-if="props.mode == 'projects'"></ProjectCard>
                
            </div>
		</div>

        <div class="offcanvas offcanvas-bottom" tabindex="-1" id="ImageSetPanel" ref="offCanvasSet" aria-labelledby="offcanvasBottomLabel">
            <div class="offcanvas-header">
                <h5 v-if="store.current_node" class="offcanvas-title" id="offcanvasBottomLabel"> {{ store.current_node.data.label }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body small">

                <div v-if="state.setdata.length" class="container">
                    <div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
                        <!-- Images -->
                        <div v-for="file in state.setdata" class="col w-200 shadow-1-strong rounded mb-4">
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
                        </div>
                    </div>
            </div>
        </div>
    </div>


</div>

  
</template>


<script setup>

    import { onMounted, watch, reactive, ref, nextTick } from "vue";
    import web from "../web.js";
    import NodeCard from "./NodeCard.vue";
    import ProjectCard from "./ProjectCard.vue";

    import {store} from "./Store.js";
    //import {getLayoutSettings} from "./GraphOptions.js";
    import { useRouter, useRoute } from 'vue-router'

    import { GlobalVueFlowStorage, Position, VueFlow, defaultNodeTypes, useVueFlow } from '@vue-flow/core'

    //const { getNode, onNodeClick, onNodeDoubleClick, onNodeDragStop} = useVueFlow()
    const flow = useVueFlow({
        defaultZoom: 0.5,
        maxZoom: 3,
        minZoom: 0.1,
    })

    import ImageNode from './nodes/ImageNode.vue'
    import ProjectNode from './nodes/ProjectNode.vue'
    import ProcessingNode from './nodes/ProcessingNode.vue'
    import PDFNode from './nodes/PDFNode.vue'
    import TextNode from './nodes/TextNode.vue'
    import SetNode from './nodes/SetNode.vue'

    import { useShuffle } from './useShuffle'
    import { useLayout } from './useLayout'
    import Icon from './Icon.vue'

    // import * as bootstrap from "bootstrap/dist/js/bootstrap"
    import * as bootstrap from 'bootstrap';
    window.bootstrap = bootstrap;

    const { graph_dagre, layout, previousDirection } = useLayout()

    const elements = reactive({nodes: [], edges:[]})




	const CLUSTER = 1

    const route  = useRoute();
    const router = useRouter();

	const offCanvasSet = ref(null)
    var settable = ref(null)
    var state = reactive({setdata:[]})

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
                    addNode(wsdata.target, wsdata.type, wsdata.node)
                } else if (wsdata.command == 'update') {
                    console.log('updating ', wsdata.target)
                    var target_node = elements.nodes.find(x => x.id == wsdata.target)
                    if(target_node) {
                        if(wsdata.image) target_node.data.image = wsdata.image
                        if(wsdata.description) target_node.data.description = wsdata.description
                    }
                }

            }
        } catch(e) {
            console.log('WS virhe', e)
            console.log(event.data)
        }
    }
    // Websocket for UI updates ends


    connection.onerror = (error) => {
        console.error('WebSocket Error:', error);
    };

    const props = defineProps({
        mode: ''
    })


    flow.onNodeDragStop((event) => {
        store.current_node = event.node
        console.log(event.node.position)
        //saveLayout()
        connection.send(JSON.stringify({id:event.node.id, position:event.node.position}))
    })


    flow.onNodeClick((event) => {
        store.current_node = event.node
        
        //flow.fitView()
    })

    flow.onPaneClick((event) => {
        store.current_node = null
    })

    flow.onNodeDoubleClick((event) => {
        if(event.node.type == "project" ) {
            router.push({ name: 'graph', query: { node: event.node.id.replace('#', '')} })
        } else if(event.node.type == "set") {
            toggleOffcanvas(event.node)
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
    	() => route.params,
      	async (newValue, oldValue) => {
        	loadGraph(route, oldValue)
    })


    watch(
    	() => store.update,
      	async (newValue, oldValue) => {
            if(store.update_data) updateGraphNode(store.update_data)
        	else loadGraph(route, oldValue)
    })

    async function layoutGraph(direction) {

        //nodes.value = layout(nodes.value, edges.value, direction)
        elements.nodes = layout(elements.nodes, elements.edges, direction)

        nextTick(() => {
            flow.fitView()
        })
    }

    async function toggleOffcanvas(node) {
      const offcanvasElement = new bootstrap.Offcanvas(document.getElementById('ImageSetPanel'));
      offcanvasElement.toggle(); // Toggle the offcanvas
      console.log(node)
      state.setdata = await web.getSetFiles(node.id)
    }

    function updateGraphNode(update) {
        console.log(update)
        cy.nodes().forEach(function( ele ){
            if(ele.id() == update.id) {
                ele.data('name', update.name)
            }
        });
    }

    function addNode(target, type, node) {
        console.log(target)
        console.log(node)
        const id = node['@rid'] || node.rid || node.id
        const nodetype = node['@type'] || node.type
        const newNode = {
            id: id,
            data: node,
            image: 'api/thumbnails/projects/73_2/files/31_13',
            type: type,
            position: { x: Math.random() * flow.dimensions.value.width, y: Math.random() * flow.dimensions.value.height },
        }
        
        console.log('adding node', newNode)
        console.log('to node ', target)
        elements.nodes.push(newNode)
        console.log(`source: ${target}, target: ${id}`)

        elements.edges.push({id:Math.random() + 'edge', source: target, target: id})
        layoutGraph('LR')
    }

    function expandSetNode(node, target) {
        if(node['@rid']) node.rid = node['@rid']
        console.log(node)
        const newNode = {
            id: node.rid,
            data: node,
            type: node.type,
            position: { x: Math.random() * flow.dimensions.value.width, y: Math.random() * flow.dimensions.value.height },
        }
        elements.value.push(newNode)
        //flow.addNodes([newNode])
        elements.value.push({id:6, source: target, target: node.rid})
    }

	async function loadGraph(route, oldValue) {
		var layout = ''
        graph.result.data = {}

         if(route.query.node) {

            graph.result.data = await web.getProject(route.query.node)
      
        } else {
            await loadProjects()
        }

        drawGraph(layout, route, oldValue)

	}


    async function drawGraph(layout_name, route, oldValue) {


        var positions = await getNodePositions()
        console.log(positions)

        for(var node of graph.result.data.nodes) {
            var flownode = {
                id: node.data.id, 
                type: node.data.type.toLowerCase(),
                data: {
                    type: node.data.type.toLowerCase(),
                    label: node.data.name,
                    description: node.data.description,
                    paths: node.data.paths
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
        
        if(props.mode !== 'projects')
            layoutGraph('LR')

        nextTick(() => {
            flow.fitView()
        })
        //flow.fitView()
        //var layout = getLayoutSettings(layout_name)
        



    }

    function getDefaultPosition() {
        return {x: 0, y: 0}
    }

    function fitGraph() {

    }


    function setNodePositions(node_layout, layout) {

        if(node_layout.positions) {
            cy.nodes().positions(function( node, i ){
                if(node_layout.positions[node.id()]) {
                    return {
                        x: node_layout.positions[node.id()].x,
                        y: node_layout.positions[node.id()].y
                    };
                } else {

                }
            });
        }

		layout.run()
    }

    async function getNodePositions() {
        var node = route.query.node
        if(route.query.query)
            node = route.query.query
        else if(props.mode == 'projects')
            node = props.mode

        if(node) {
            console.log(node)
            var node_layout = await web.getLayoutByTarget(node)
            return node_layout

        }
        return 0
    }

	async function setGraphOptions(layout_name) {

        console.log(layout_name)
		const settings = getLayoutSettings(layout_name)
		const layout = cy.layout(settings.layout);

        if(layout_name === 'preset' ) {
            var node_layout = await getNodePositions()
            setNodePositions(node_layout, layout)
        } else {
            layout.run()
        }

	}

	async function saveLayout() {
        console.log(elements.value)
		var positions = {}
		elements.nodes.forEach(function(ele){
			positions[ele.id] = ele.position
            console.log(ele)
		})
		if(route.query.node)
			web.saveLayout(positions, route.query.node)
        else if(props.mode == 'projects')
            web.saveLayout(positions, props.mode)
	}


    async function loadProjects() {
        graph.result.data = {nodes: [], edges:[]}
        graph.result.data.nodes = await web.getProjects()
        // convert projects to graph format
        for(var node of graph.result.data.nodes) {
            node.data = {id:node['@rid']}
            node.data.name = node.label
            node.data.type = node['@type']
            node.data.description = node.file_count + ' files'
            node.data.paths = node.paths
        }
        
    }


	async function initView() {

        if(!store.user) store.user = await web.getMe()
        if(store.graph_style.length == 0) store.graph_style = await web.getStyle()

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
