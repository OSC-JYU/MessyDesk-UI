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
    background-color: #005757 !important;
    color: white !important;
}

.process-banner {
    backdrop-filter: blur(2px);
    border-bottom: 1px solid rgba(255,255,255,0.25);
}

.process-banner-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.process-banner-main {
    font-weight: 600;
}

.process-banner-sub {
    font-size: 12px;
    opacity: 0.92;
}




</style>

<template>

<DebugFloatingWindow/>


 
<template v-for="(process, key) in state.running_processes" :key="key" >
    <v-banner v-if="process.status == 'running' || process.status == 'paused' || process.status == 'cancelling'"
        class="process-banner"
        lines="two"
        :color="process.status == 'paused' ? 'amber-darken-2' : (process.status == 'cancelling' ? 'red-darken-1' : 'teal-darken-2')"
        :icon="process.status == 'paused' ? 'mdi-pause-circle' : (process.status == 'cancelling' ? 'mdi-close-circle' : 'mdi-run')"
    >
        <template v-slot:text>
            <div class="process-banner-text">
                <div class="process-banner-main">[{{ key }}] {{ process.message }}</div>
                <div v-if="process.batch" class="process-banner-sub">
                    State: {{ process.batch.state || process.status }} | Processed: {{ process.batch.processed_files ?? 0 }}/{{ process.batch.total_files ?? '?' }} | Failed: {{ process.batch.failed_files ?? 0 }} | ETA: {{ formatEta(process.batch.eta_sec) }}
                </div>
            </div>
        </template>
        <v-progress-linear
            v-if="process.batch && process.batch.total_files > 0"
            :model-value="Math.min(100, ((process.batch.processed_files || 0) / process.batch.total_files) * 100)"
            height="4"
            class="mb-2"
            color="white"
            bg-color="rgba(255,255,255,0.35)"
        ></v-progress-linear>
        <v-btn v-if="process.status == 'running'" color="white" class="mr-2" @click="pauseProcess(key)">
            Pause
        </v-btn>
        <v-btn v-if="process.status == 'paused'" color="white" class="mr-2" @click="resumeProcess(key)">
            Resume
        </v-btn>
        <v-btn v-if="process.status == 'running' || process.status == 'paused'" color="white" @click="cancelProcess(key)">
            Cancel 
        </v-btn>

    </v-banner>
</template>



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
                            <v-btn
                                v-if="state.setdata.mode == 'children'"
                                density="compact"
                                icon="mdi-arrow-left"
                                class="mr-2"
                                @click="goBackToGroupList()"
                            ></v-btn>
                            <v-icon size="35" color="green">mdi-folder-outline</v-icon>
                            {{ store.current_node.data.label }} <span v-if="state.setdata.file_count">({{ state.setdata.file_count }} files )</span>
                            <span v-if="state.setdata.mode == 'groups'" class="ml-2 text-body-2">({{ state.setdata.group_count || 0 }} sources)</span>
                            <span v-if="state.setdata.mode == 'children' && state.selected_source_label" class="ml-2 text-body-2">- {{ state.selected_source_label }}</span>
                            
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
                            v-for="(file, index) in state.setItems"
                            :key="file['@rid'] || file.source_rid || index"
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

                        <template #node-json="{ data }">
                            <JSONNode :data="data" />
                        </template>

                        <template #node-similarity_results.json="{ data }">
                            <JSONNode :data="data" />
                        </template>

                        <template #node-pos.json="{ data }">
                            <JSONNode :data="data" />
                        </template>

                        <template #node-bow.json="{ data }">
                            <JSONNode :data="data" />
                        </template>

                        <template #node-filter="{ data }">
                            <FilterNode :data="data" />
                        </template>

                        <template #node-set="{ data }">
                            <SetNode :data="data" />
                        </template>

                        <template #node-roi-set="{ data }">
                            <SetFilterNode :data="data" />
                        </template>

                        <template #node-dspace7="{ data }">
                            <SourceNode :data="data" />
                        </template>

                        <template #node-dspace7.json="{ data }">
                            <JSONNode :data="data" />
                        </template>

                        <template #node-solr.json="{ data }">
                            <JSONNode :data="data" />
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

                        <template #node-csv="{ data }">
                            <TextNode :data="data" />
                        </template>

                        <template #node-html="{ data }">
                            <HTMLNode :data="data" />
                        </template>

                        <template #node-polygons.json="{ data }">
                            <PolygonNode :data="data" />
                        </template>

                        <template #node-faiss.json="{ data }">
                            <SearchNode :data="data" />
                        </template>

                        <template #node-empty="{ data }">
                            <EmptyNode :data="data" />
                        </template>

                        <template #node-error.json="{ data }">
                            <ErrorNode :data="data" />
                        </template>
                        
                        <Background />

                        </VueFlow>  

                        <!-- View controls-->
                         <v-sheet style="position: absolute; bottom: 0px; right: 10px;" > 
                 
                            <v-chip @click="isolateNode()" class="ml-2" size="x-small" :color="state.isolate_view ? 'red' : 'green'" variant="flat" ><v-icon :icon="state.isolate_view ? 'mdi-eye-off' : 'mdi-eye'"></v-icon>
                                {{ state.isolate_view ? 'show all': 'isolate' }}
                            </v-chip>

                            <v-chip @click="toggleProcesses()" class="ml-2" size="x-small" :color="state.compact_view ? 'red' : 'green'"  variant="outlined"><v-icon :icon="state.compact_view ? 'mdi-eye-off' : 'mdi-eye'"></v-icon>
                                {{ state.compact_view ? 'show processes' : 'hide processes'  }}
                            </v-chip>



                            <v-icon   @click="flow.fitView({duration: 1000, padding: padding})" class="mr-2 ml-4" title="reset view"  size="25" >mdi-fullscreen</v-icon>  

                         </v-sheet>

          
    
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
    const { updateNode, updateNodeData, findNode } = useVueFlow()

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
    import SetFilterNode from "./nodes/SetFilterNode.vue";
    import FilterNode from './nodes/FilterNode.vue'
    import JSONNode from './nodes/JSONNode.vue'
    import OSDNode from './nodes/OSDNode.vue'
    import HumanNode from './nodes/HumanNode.vue'
    import NERNode from './nodes/NERNode.vue'
    import SourceNode from './nodes/SourceNode.vue'
    import ZIPNode from './nodes/ZIPNode.vue'
    import OCRNode from './nodes/OCRNode.vue'
    import HTMLNode from './nodes/HTMLNode.vue'
    import PolygonNode from './nodes/PolygonNode.vue'
    import EmptyNode from './nodes/EmptyNode.vue'
    import SearchNode from './nodes/SearchNode.vue'
    import ErrorNode from './nodes/ErrorNode.vue'

    import SetViewNode from './nodes/SetViewNode.vue'
    import DebugFloatingWindow from './DebugFloatingWindow.vue'

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
        setdata: {files: [], groups: [], mode: 'groups', file_count: 0, group_count: 0}, 
        setItems: [],
        selected_source_rid: null,
        selected_source_label: '',
        setPanel: false, 
        rootNodes:[], 
        node_added: 0, 
        node_updated: 0,
        process_update: false,
        message: '',
        action: '',
        compact_view: false,
        isolate_view: false,
        running_processes: store.running_processes
    })

    let batchRefreshTimer = null

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
                
                var wsdata = JSON.parse(event.data);
                console.log('wsdata', wsdata)
                if(wsdata.command == 'add') {
                    addNode(wsdata)
                } else if(wsdata.command == 'update') {
                    updateNodeKey(wsdata.target, wsdata.node)
                } else if(wsdata.command == 'add_and_finish') {
                    addNode(wsdata)
                } else if(wsdata.command == 'process_update' || wsdata.command == 'process_finished') {
                    updateProcess(wsdata)
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
        batchRefreshTimer = setInterval(refreshRunningBatches, 3000)
    });

    // Clean up when component is unmounted
    onUnmounted(() => {
        console.log('Component unmounting, closing SSE connection...');
        if (eventSource) {
            eventSource.close();
        }
        if(batchRefreshTimer) {
            clearInterval(batchRefreshTimer)
            batchRefreshTimer = null
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
        }else if(event.node.type == 'roi-set') {
            store.filter_editor = event.node
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
            console.log('open-node', event.node)
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
        if(file?.is_group && file?.source_rid) {
            openSetGroup(file)
            return
        }
        const absoluteIndex = ((page.value - 1) * filesPerPage) + index
        const browseContext = {
            mode: state.setdata.mode || 'flat',
            sourceRid: state.selected_source_rid || null,
            sourceLabel: state.selected_source_label || null,
            groupBoundary: state.setdata.group_boundary || null,
        }
        emit('open-node', file['@rid'], store.current_node.id, state.setdata.file_count, absoluteIndex, browseContext)
    } 

    async function layoutGraph(direction) {

        //nodes.value = layout(nodes.value, edges.value, direction)
        elements.nodes = layout(elements.nodes, elements.edges, direction)

        // nextTick(() => {
        //     flow.fitView()
        // })
    }


    function formatEta(etaSec) {
        if(etaSec === null || etaSec === undefined || etaSec === '') return 'n/a'
        const sec = Number(etaSec)
        if(!Number.isFinite(sec)) return 'n/a'
        if(sec < 60) return `${Math.max(sec, 0)}s`
        const minutes = Math.floor(sec / 60)
        const seconds = sec % 60
        if(minutes < 60) return `${minutes}m ${seconds}s`
        const hours = Math.floor(minutes / 60)
        const remMin = minutes % 60
        return `${hours}h ${remMin}m`
    }

    function upsertRunningProcess(processRid, attrs = {}) {
        if(!state.running_processes[processRid]) {
            state.running_processes[processRid] = {
                message: 'Working...',
                status: 'running',
                batch: null,
            }
        }
        Object.assign(state.running_processes[processRid], attrs)
        store.running_processes = state.running_processes
    }

    async function refreshRunningBatches() {
        const ids = Object.keys(state.running_processes)
        for(const processRid of ids) {
            const process = state.running_processes[processRid]
            if(process?.status == 'running' || process?.status == 'paused' || process?.status == 'cancelling') {
                await hydrateBatchInfo(processRid)
            }
        }
    }

    async function hydrateBatchInfo(processRid) {
        try {
            const batch = await web.getBatch(processRid)
            if(!batch) return
            const stateName = batch.state || 'running'
            const eta = formatEta(batch.eta_sec)
            const processed = batch.processed_files ?? 0
            const total = batch.total_files ?? '?'
            const avg = batch.avg_sec_per_file ?? 0
            upsertRunningProcess(processRid, {
                status: stateName,
                batch: batch,
                message: `${processed}/${total} files, ETA ${eta}, avg ${avg}s/file`,
            })
        } catch(e) {
            console.log('batch hydrate failed', processRid, e?.message)
        }
    }

    function updateProcess(wsdata) {
        var label = ''
        var node = elements.nodes.find(x => x.id == wsdata.process['@rid'])
        if(node && node.data.label) {
            label = node.data.label
        }

        upsertRunningProcess(wsdata.process['@rid'], {
            status: wsdata?.process?.status || 'running',
        })

        if(wsdata.command == 'process_finished') {
            //state.message = 'Process finished with ' + label
            //state.process_update = false
            if(state.running_processes[wsdata.process['@rid']]) {
                state.running_processes[wsdata.process['@rid']].status = wsdata?.batch?.state || wsdata?.process?.status || 'finished'
                if(wsdata?.batch) {
                    const eta = formatEta(wsdata.batch.eta_sec)
                    const processed = wsdata.batch.processed_files ?? wsdata.current_file ?? 0
                    const total = wsdata.batch.total_files ?? wsdata.total_files ?? '?'
                    const failed = wsdata.batch.failed_files ?? 0
                    state.running_processes[wsdata.process['@rid']].batch = wsdata.batch
                    state.running_processes[wsdata.process['@rid']].message = `Done ${processed}/${total}, failed ${failed}, ETA ${eta}`
                }
                store.running_processes = state.running_processes
            }
            if(wsdata.process) updateNodeKey(wsdata.process['@rid'], wsdata.process)
            if(wsdata.set) updateNodeKey(wsdata.set['@rid'], wsdata.set)
            return
        } 
        
        if(wsdata.command == 'process_update') {
            if(!state.running_processes[wsdata.process['@rid']]) {
                upsertRunningProcess(wsdata.process['@rid'], {message: label + ' Working...', status: 'running'})
            }
            // we may receive update after process is cancelled and we do not want to update the message
            if(state.running_processes[wsdata.process['@rid']].status != 'finished') {
                if(wsdata?.batch) {
                    const eta = formatEta(wsdata.batch.eta_sec)
                    const processed = wsdata.batch.processed_files ?? wsdata.current_file ?? 0
                    const total = wsdata.batch.total_files ?? wsdata.total_files ?? '?'
                    const failed = wsdata.batch.failed_files ?? 0
                    state.running_processes[wsdata.process['@rid']].batch = wsdata.batch
                    state.running_processes[wsdata.process['@rid']].status = wsdata.batch.state || state.running_processes[wsdata.process['@rid']].status
                    state.running_processes[wsdata.process['@rid']].message = `${label}: ${processed}/${total}, failed ${failed}, ETA ${eta}`
                    store.running_processes = state.running_processes
                } else if(wsdata.total_files && wsdata.current_file) {
                    state.running_processes[wsdata.process['@rid']].message = 'Working with file ' + wsdata.current_file + '/' + wsdata.total_files + ' with "' + label + '"'
                    store.running_processes = state.running_processes
                } else {
                    state.running_processes[wsdata.process['@rid']].message = 'Working with ' + label            
                    store.running_processes = state.running_processes
                }
                if(wsdata.set) updateNodeKey(wsdata.set['@rid'], wsdata.set)
            }
            
        }

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
            const nodetype = wsdata.type
            if(nodetype == 'process') {
                if(wsdata.output) {
                    wsdata.node.status = "waiting" // if output is set, then process is waiting for set to be finished
                } else {
                    wsdata.node.status = "running"
                }
            }
            wsdata.node.type = wsdata.node['@type'].toLowerCase() // "File" -> "file"
            wsdata.node.image = wsdata.image
            const newNode = {
                id: id,
                data: wsdata.node,
                type: nodetype,
                image: wsdata.image,
                position: { x: Math.random() * flow.dimensions.value.width, y: Math.random() * flow.dimensions.value.height },
            }

            elements.nodes.push(newNode)
            //console.log('newNode', newNode)

            state.node_added = id
            if(wsdata.input)
                elements.edges.push({id:Math.random() + 'edge', source: wsdata.input, target: id})

            // if output i set, then we create Set node and link to it new node
            if(wsdata.output) {
                wsdata.output.status = 'running'  // we set status to running so that crunher icon is NOT shown
                wsdata.output.type = wsdata.output['@type'].toLowerCase()
                const setNode = {
                    id: wsdata.output['@rid'],
                    data: wsdata.output,
                    type: 'set',                // output is always Set node
                    image: wsdata.output.image,
                    position: { x: Math.random() * flow.dimensions.value.width, y: Math.random() * flow.dimensions.value.height },
                }
                elements.nodes.push(setNode)
                console.log('setNode', setNode)
                elements.edges.push({id:Math.random() + 'edge', source: id, target: wsdata.output['@rid']})
            }

            layoutGraph('LR')
            // add banner if this is batch process (set process)
            if(nodetype == 'process' && wsdata.output) {
                // add process to running processes
                state.running_processes[wsdata.node['@rid']] = {message: wsdata.node.label + ' Process created', status: 'running', batch: null}
                store.running_processes = state.running_processes
                hydrateBatchInfo(wsdata.node['@rid'])
            }

            if(wsdata.process) {
                updateNodeKey(wsdata.process['@rid'], wsdata.process)
            }
            
        }


    }
    
    function updateNodeKey(target_rid, node) {
        var target_node = elements.nodes.find(x => x.id == target_rid)
        if(target_node && node) {
            if(node.image)  target_node.data.image = node.image
            if(node.status)  target_node.data.status = node.status
            if(node.label)  target_node.data.label = node.label
            if(node.description)  target_node.data.description = node.description
            if(node.info)  target_node.data.info = node.info
            if(node.file_count)  target_node.data.file_count = node.file_count
            if(node.count)  target_node.data.count = node.count
            if(node.roi_count)  target_node.data.roi_count = node.roi_count
            if(node.duration)  target_node.data.duration = node.duration
            if(node.metadata)  target_node.data.metadata = node.metadata
            if(node.paths)  target_node.data.paths = node.paths
        }
    }

    async function fitToNode(id, padding) {
        var node = elements.nodes.find(x => x.id == id)
        store.current_node = node
        if(!padding) padding = 5
        flow.fitView({nodes: [id], duration: 1000, padding: padding})
       
    }


    async function isolateNode() {
        state.isolate_view = !state.isolate_view
        if(state.isolate_view && store.current_node) {
            flow.fitView({nodes: [store.current_node.id], duration: 1000, padding: 5})
            hideOthers(store.current_node.id)
        } else {
            showOthers()
            flow.fitView({duration: 1000})
        }
    }

    function getParents(node) {
        let parents = flow.getIncomers(node)
        let allParents = [...parents]
        
        for (let parent of parents) {
            const grandparents = getParents(parent)
            allParents = [...allParents, ...grandparents]
        }
        
        return allParents
    }

    function getChildren(node) {
        let children = flow.getOutgoers(node)
        let allChildren = [...children]
        for(let child of children) {
            const grandchildren = getChildren(child)
            allChildren = [...allChildren, ...grandchildren]
        }
        return allChildren
    }

    async function hideOthers(id) {
        const current_node = findNode(id)
        // we need to get parent recursively
        var parents = getParents(current_node)
        var children = getChildren(current_node)

        var paths = [...parents, ...children]
        var isolated = paths.map(path => path.id)
        for(var path of paths) {
            updateNodeData(path.id, {isolated: true})
        }

        for(var node of elements.nodes) {
            if(node.id != id && !isolated.includes(node.id)) {
                updateNode(node.id, {hidden: true})
            }
        }  
    }

    async function showOthers() {
        for(var node of elements.nodes) {
            updateNode(node.id, {hidden: false})
        }
    }

    async function toggleProcesses() {
        if(state.compact_view) {
            state.compact_view = false
            showProcesses()
            drawGraph()
        } else {
            hideProcesses()
        }
    }

    async function hideProcesses() {
        for(var node of elements.nodes) {
            if(node.type == 'process') {
                const parent = flow.getIncomers(node)
                const children = flow.getOutgoers(node)
                // we need to connect parent to all children with new edge
                for(var child of children) {
                    elements.edges.push({id:Math.random() + 'edge', source: parent[0].id, target: child.id})
                }
                //elements.edges.push({id:Math.random() + 'edge', source: parent[0].id, target: node.id})
                updateNode(node.id, {hidden: true})
            }
        }
        state.compact_view = true
        layoutGraph('LR')
    }

    async function showProcesses() {
        for(var node of elements.nodes) {
            if(node.type == 'process') {
                updateNode(node.id, {hidden: false})
            }
        }
    }

    async function toggleSetPanel(node) {
        page.value = 1
        state.selected_source_rid = null
        state.selected_source_label = ''
        await loadSetGroups()
        state.setPanel = true
    }

    async function loadSet() {
        if(state.selected_source_rid) {
            await loadSetChildren()
            return
        }
        await loadSetGroups()
    }

    function syncSetItemsAndPagination() {
        if(state.setdata.mode == 'children') {
            state.setItems = state.setdata.files || []
            totalPages.value = Math.max(1, Math.ceil((state.setdata.file_count || 0) / filesPerPage))
            return
        }
        if(state.setdata.mode == 'flat') {
            state.setItems = state.setdata.files || []
            totalPages.value = Math.max(1, Math.ceil((state.setdata.file_count || 0) / filesPerPage))
            return
        }
        state.setItems = state.setdata.groups || []
        totalPages.value = Math.max(1, Math.ceil((state.setdata.group_count || 0) / filesPerPage))
    }

    async function loadSetGroups() {
        state.setdata = await web.getSetFiles(
            store.current_node.id,
            (page.value - 1) * filesPerPage,
            filesPerPage,
            {groupByOrigin: true, groupBoundary: 'pdf'}
        )
        state.setdata.mode = state.setdata.mode || 'groups'
        syncSetItemsAndPagination()
    }

    async function loadSetChildren() {
        state.setdata = await web.getSetFiles(
            store.current_node.id,
            (page.value - 1) * filesPerPage,
            filesPerPage,
            {groupByOrigin: true, sourceRid: state.selected_source_rid, groupBoundary: 'pdf'}
        )
        state.setdata.mode = state.setdata.mode || 'children'
        syncSetItemsAndPagination()
    }

    async function openSetGroup(group) {
        state.selected_source_rid = group.source_rid
        state.selected_source_label = group.label || ''
        page.value = 1
        await loadSetChildren()
    }

    async function goBackToGroupList() {
        state.selected_source_rid = null
        state.selected_source_label = ''
        page.value = 1
        await loadSetGroups()
    }



    async function expandSetNode(node) {
        if(node?.is_group) return

        await web.setNodeAttribute(node['@rid'], {key: 'expand', value: node.expand })
        loadGraph()

    }


    async function cancelProcess(process_rid) {
        upsertRunningProcess(process_rid, {status: 'cancelling', message: 'Cancelling...'})
        try {
            await web.cancelBatch(process_rid)
        } catch(e) {
            // fallback to old endpoint for legacy paths
            await web.cancelProcess(process_rid)
        }
        await hydrateBatchInfo(process_rid)
    }

    async function pauseProcess(process_rid) {
        upsertRunningProcess(process_rid, {status: 'paused', message: 'Pausing...'})
        await web.pauseBatch(process_rid)
        await hydrateBatchInfo(process_rid)
    }

    async function resumeProcess(process_rid) {
        upsertRunningProcess(process_rid, {status: 'running', message: 'Resuming...'})
        await web.resumeBatch(process_rid)
        await hydrateBatchInfo(process_rid)
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
        const runningRids = Object.keys(state.running_processes)
        for(const rid of runningRids) {
            await hydrateBatchInfo(rid)
        }
        

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

            if(node.data.model) 
                flownode.data.model = node.data.model

            if(node.data.metadata)
                flownode.data.metadata = node.data.metadata

            if(node.data.forward)
                flownode.data.forward = node.data.forward

            if(node.data.process_rid)
                flownode.data.process_rid = node.data.process_rid

            if(node.data.error) 
                flownode.data.error = node.data.error

            if(node.data.error_count) 
                flownode.data.error_count = node.data.error_count

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
