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
        height: 500px !important;
        margin-top:20px;
      
    }

    .vue-flow__edge-path, .vue-flow__connection-path {
        stroke-width: 4;
    }


    img {

  margin: 0px
}
.node-image {
  padding:0px
}



.image_display {
  max-height: 250px;
}
.v-banner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
}


</style>

<template>
<v-banner v-if="state.process_update"
   
      lines="one"
    >
      <template v-slot:text>
        {{ state.message }}
      </template>

      <template v-slot:actions>
        <v-btn color="deep-purple-accent-4">
          {{ state.action }}
        </v-btn>
      </template>
    </v-banner>

 <div id="container" class="w-100">
		<div class="row h-100" >


			<div class="col-12 px-0">
                
                <div class="graph-display">
                  
                   
                    <!-- set panel -->
                    <v-navigation-drawer  v-if="store.current_node" v-model="state.setPanel" temporary location="bottom" >

                        <v-toolbar color="#005757" density="compact" style="position: fixed; z-index: 1000;">
                        <template v-slot:prepend>
                            
                            <v-menu>
                                <template v-slot:activator="{ props }">
                                <v-app-bar-nav-icon v-bind="props"></v-app-bar-nav-icon>
                                </template>

                                <v-list>
                                    <v-list-item>
                                        <v-list-item-title>                        
                                            <v-btn 
                                                @click="store.set_uploader_open = true"
                                                >
                                                <template v-slot:prepend>
                                                    <v-icon  icon="mdi-file"></v-icon>
                                                </template>
                                                    Add file to set 
                                            </v-btn>
                                        </v-list-item-title>
                                    </v-list-item>
                                </v-list>
                            </v-menu>
                        </template>

                        <v-toolbar-title>
                            <v-icon size="35" color="green">mdi-folder-outline</v-icon>
                            {{ store.current_node.data.label }} <span v-if="state.setdata.file_count">({{ state.setdata.file_count }} files )</span>
                            
                        </v-toolbar-title>
                        
                        <v-pagination
                            v-model="page"
                            :length="totalPages"
                            :total-visible="16"
                            class="mt-4"
                            ></v-pagination>
                            
                        </v-toolbar>

                        <v-divider></v-divider>
                        
                        <v-row class="set-panel mt-8">
                            <v-col
                            v-for="(file, index) in state.setdata.files"
                            :key="file.id"
                            class="d-flex child-flex flow"
                            cols="2"
                            >

                            <!-- SET VIEW NODE-->
                             
                            <SetViewNode @dblclick="openSetFile(file, index)" :data="file" @expand-node="expandSetNode(file)"></SetViewNode>

                            </v-col>
                        </v-row>


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

                        <template #node-nextcloud="{ data }">
                            <SourceNode :data="data" />
                        </template>

                        <template #node-human.json="{ data }">
                            <HumanNode :data="data" />
                        </template>

                        <template #node-ner.json="{ data }">
                            <NERNode :data="data" />
                        </template>

                        <template #node-zip="{ data }">
                            <ZIPNode :data="data" />
                        </template>

                        <template #node-osd.json="{ data }">
                            <OSDNode :data="data" />
                        </template>

                        <template #node-ocr.json="{ data }">
                            <OCRNode :data="data" />
                        </template>

                        <template #node-empty="{ data }">
                            <EmptyNode :data="data" />
                        </template>
                        
                        <Background />

                        </VueFlow>  
                        <!-- center view-->
                        <v-icon  style="position: absolute; bottom: 10px; right: 30px;" @click="flow.fitView({duration: 1000, padding: padding})" title="reset view"  size="25" >mdi-fullscreen</v-icon>

                        <template v-if="props && props.mode == 'graph'">
                            <v-icon  style="position: absolute; bottom: 10px; right: 30px;" @click="flow.fitView({duration: 1000, padding: padding})" title="reset view"  size="25" >mdi-fullscreen</v-icon>
                            <!-- <v-icon  style="position: absolute; bottom: 10px; right: 90px;" @click="layoutGraph('LR')" title="original files only"  size="25" >mdi-arrow-right-box</v-icon>
                            <v-icon  style="position: absolute; bottom: 10px; right: 60px;" @click="layoutGraph('TB')" title="order to top down"  size="25" >mdi-arrow-down-box</v-icon> -->
                        </template>
                </div>
			</div>

		</div>

</div>

  
</template>


<script setup>

    import { onMounted, watch, reactive, ref, computed, onUnmounted } from "vue";
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
    import SourceNode from './nodes/SourceNode.vue'
    import ZIPNode from './nodes/ZIPNode.vue'
    import OCRNode from './nodes/OCRNode.vue'
    import EmptyNode from './nodes/EmptyNode.vue'

    import SetViewNode from './nodes/SetViewNode.vue'

    import { useShuffle } from './useShuffle'
    import { useLayout } from './useLayout'
    import Icon from './Icon.vue'

    const apiUrl = import.meta.env.VITE_API_PATH
    // Remove WebSocket URL
    // const wsURL = import.meta.env.MODE === 'production' ? `wss://${window.location.host}/${apiUrl}/ws` : 'ws://localhost:8200/ws'

    const { graph_dagre, layout, previousDirection } = useLayout()

    const elements = reactive({nodes: [], edges:[]})

    const emit = defineEmits(['open-node'])


	const CLUSTER = 1
    const filesPerPage = 10; // Number of files per page

    const route  = useRoute();
    const router = useRouter();

	const offCanvasSet = ref(null)
    var settable = ref(null)
    var state = reactive({
        setdata:[], 
        setPanel: false, 
        rootNodes:[], 
        node_added: 0, 
        node_updated: 0,
        process_update: false,
        message: '',
        action: ''
    })

    var current_node = reactive({})
    var current_graph_node = reactive({position: {}})
    var graph = reactive({result:[]})
    var schema = reactive({result:[]})
	var tags = reactive({result:[]})
    var me = reactive({data:{}})
    var editing = ref(false)
    var page = ref(1)  // set page for pagination
    var totalPages = ref(1)  // set page count for pagination
    // const totalPages = computed(() => {
    //     return 10
    //     return Math.ceil(state.setdata.file_count / filesPerPage);
    // });

    // Replace WebSocket connection with SSE
    let eventSource = null;



    function connectSSE() {
        if (eventSource) {
            eventSource.close();
        }

        const url = `${apiUrl}/events`;
        console.log('Connecting to SSE at:', url);
        
        // Create EventSource with the last event ID if available
        eventSource = new EventSource(url);

        eventSource.onopen = () => {
            console.log('SSE Connection opened');
            console.log('Last event ID:', eventSource.lastEventId);
        };

        eventSource.onmessage = (event) => {
            // Log the event ID for debugging
            //console.log('Event ID:', event.lastEventId);
          
            try {
                //console.log('Received SSE message:', event.data);
                var wsdata = JSON.parse(event.data);
                if(wsdata.target) {
                    console.log('wsdata', wsdata)
                    if(wsdata.command == 'process_update') {
                        state.process_update = true
                        state.message = 'Working... ' + wsdata.current_file + '/' + wsdata.total_files
                        state.action = 'Close'
                        updateNodeKey(wsdata.target, 'count', wsdata.current_file)
                        
                    } else if(wsdata.command == 'process_finished') {
                        state.process_update = false
                        state.message = 'Finished'
                        state.action = 'Close'
                        updateNodeKey(wsdata.target, 'count', wsdata.current_file)
                        updateNodeKey(wsdata.target, 'paths', wsdata.paths)

                    } else if(wsdata.command == 'add') {
                        addNode(wsdata) 
                        // check if we another node (set processing produces Process and Set)
                        if(wsdata.set_node) {
                            wsdata.target = wsdata.node['@rid']
                            wsdata.node = wsdata.set_node
                            wsdata.type = 'set'
                            addNode(wsdata)
                        }

                    } else if (wsdata.command == 'update') {
                        if(state.setPanel) loadSet()  // update set panel if open

                        console.log('updating ', wsdata.target)
                        var target_node = elements.nodes.find(x => x.id == wsdata.target)
                        if(target_node) {
                           
                            target_node.data.error = ''
                            if(wsdata.image) target_node.data.image = wsdata.image
                            if("description" in wsdata) target_node.data.description = wsdata.description
                            if(wsdata.count) target_node.data.count = wsdata.count
                            if(wsdata.metadata) target_node.data.metadata = wsdata.metadata
                         
                            if(wsdata.roi_count || wsdata.roi_count == 0) target_node.data.roi_count = wsdata.roi_count
                            if(wsdata.error) {
                                target_node.data.error = wsdata.error
                                target_node.data.image = ''
                            }
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
                console.error('SSE message parsing error:', e);
                console.error('Raw message:', event.data);
            }
        }

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            console.error('EventSource readyState:', eventSource.readyState);
            console.error('Last event ID before error:', eventSource.lastEventId);
            
            // Close the current connection
            if (eventSource) {
                eventSource.close();
            }
            
            // Attempt to reconnect after a delay
            setTimeout(connectSSE, 5000);
        };
    }

    // Connect when component is mounted
    onMounted(() => {
        console.log('Component mounted, connecting to SSE...');
        connectSSE();
    });

    // Clean up when component is unmounted
    onUnmounted(() => {
        console.log('Component unmounting, closing SSE connection...');
        if (eventSource) {
            eventSource.close();
        }
    });

    const props = defineProps({
        mode: '',
        fit: {type: String, default: false}
    })
    

    flow.onNodeDragStop((event) => {
        store.current_node = event.node
        event.node.position = {x:Math.round(event.node.position.x/100, 10)*100, y:Math.round(event.node.position.y/100, 10)*100}
        fetch(`${apiUrl}/api/projects/${event.node.id.replace('#', '')}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({key: 'position', value: event.node.position})
        });
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
            if(!state.node_added) {
               
                flow.fitView()
                if(props.mode == "projects" && store.view) {
                   
                    flow.setViewport(store.view)
                }
            // // node is added
             } else {
                
                if(state.node_added) fitToNode(state.node_added)
                else fitToNode(store.reorder_target)

                store.reorder_target = state.node_added
                state.node_added = 0
                //store.view = flow.getViewport()
            }
        }


    })



    flow.onMoveEnd ((event) => {
        if(props.mode == "projects") store.view = flow.getViewport()
        console.log('storing view')
    })


    flow.onNodeDoubleClick((event) => {
        store.current_node = event.node

        if(event.node.type == "project" ) {
            //store.view = null
            if(store.current_node) store.current_project = store.current_node
            router.push({ name: 'graph', query: { node: event.node.id.replace('#', '')} })
        } else if(event.node.type == "set") {
            //state.setPanel = true
            toggleSetPanel()
        } else if(event.node.data.type == "file" && event.node.data._type != "zip") {
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

        }
           
    })



    //
	watch(
    	() => route.query,
    	async (newValue, oldValue) => {

			if(newValue.node || newValue.type || newValue.tag || newValue.query || newValue.map) {

    			if(newValue) console.log(Object.keys(newValue))
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

    watch(
    	() => page.value,
      	async (newValue, oldValue) => {
            loadSet()
    
    })

    function openSetFile(file, index) {
        emit('open-node', file['@rid'], store.current_node.id, state.setdata.file_count, index )
    } 

    async function layoutGraph(direction) {

        //nodes.value = layout(nodes.value, edges.value, direction)
        elements.nodes = layout(elements.nodes, elements.edges, direction)

        // nextTick(() => {
        //     flow.fitView()
        // })
    }

    
    function updateNodeKey(node, key, value) {
        console.log('updating node key', node, key, value)
        var target_node = elements.nodes.find(x => x.id == node)
        if(target_node) target_node.data[key] = value
    }

    async function fitToNode(id, padding) {
        console.log('done fitToNode', id)
        var node = elements.nodes.find(x => x.id == id)
        store.current_node = node
        if(!padding) padding = 5
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
        page.value = 1
        state.setdata = await web.getSetFiles(store.current_node.id)
        totalPages.value =  Math.ceil(state.setdata.file_count / filesPerPage) ;
        console.log(totalPages)
        state.setPanel = true
    }

    async function loadSet() {
        state.setdata = await web.getSetFiles(store.current_node.id, (page.value - 1) * filesPerPage, filesPerPage)
    }

    function addNode(wsdata) {

        // remove "empty table, empty mind" node
        if(elements.nodes.length == 1) {
            elements.nodes = elements.nodes.filter((node) => node.id !== "1")
        }
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

        elements.nodes.push(newNode)

        state.node_added = id
        if(wsdata.target)
            elements.edges.push({id:Math.random() + 'edge', source: wsdata.target, target: id})

        layoutGraph('LR')
        }

        // stop processing animation from process node
        if(wsdata.type != 'process') {
            var target_node = elements.nodes.find(x => x.id == wsdata.target)
            if(target_node) {
                target_node.data.image = ''
            }            
        }
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
                    info: node.data.info,
                    file_count: node.data.file_count,
                    count: node.data.count,
                    roi_count: node.data.roi_count
                }
            }
            if(node.position)
                flownode.position = node.position

            if(node.data.paths) {
                flownode.data.paths = []
                for(var path of node.data.paths) {
                    flownode.data.paths.push(path)
                }
            }

            if(node.data._type) {
                flownode.data._type = node.data._type.toLowerCase(),
                flownode.type = node.data._type.toLowerCase()
            }

            if(node.data.image) 
                flownode.data.image = apiUrl + node.data.image
            
            if(node.data.service) 
                flownode.data.service = node.data.service

            if(node.data.metadata)
                flownode.data.metadata = node.data.metadata

            if(node.data.error) 
                flownode.data.error = node.data.error

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
            var node_layout = await web.getLayoutByTarget(node)
            return node_layout

        }
        return 0
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
            if(node?.position?.x && node?.position?.y)
                node.position = node.position
            else
                node.position = { x: 0, y: 0}
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
