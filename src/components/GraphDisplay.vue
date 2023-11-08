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

.vue-flow__node {
  background-color:white;
  border:1px solid black;
  max-width: 202px;
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
                    <VueFlow v-model="elements" :fit-view-on-init = "true" >
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
                    </VueFlow>  
                </div>
			</div>

            <div class="col-3 sidebar p-0 h-100">
                <NodeCard v-if="props.mode == 'graph'" @setGraphOptions="setGraphOptions" @saveLayout="saveLayout" @fitGraph="fitGraph" class="h-100 w-100 position-absolute"/>

            </div>
		</div>

        <div class="offcanvas offcanvas-bottom" tabindex="-1" id="offcanvasBottom" ref="offCanvasSet" aria-labelledby="offcanvasBottomLabel">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title" id="offcanvasBottomLabel">Offcanvas bottom</h5>
                <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
            </div>
            <div class="offcanvas-body small">
            <table class="table" ref="settable">
            <thead>
                <tr>
                <th scope="col">name</th>
                <th scope="col">First</th>
                <th scope="col">Last</th>
                <th scope="col">Handle</th>
                </tr>
            </thead>
            <tbody>
            <tr v-for="item in state.setdata.nodes">
                <td>{{item.data.name}}</td>
            </tr>

            </tbody>
            </table>
            </div>
        </div>
    </div>




  
</template>


<script setup>

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import web from "../web.js";
    import NodeCard from "./NodeCard.vue";

    import {store} from "./Store.js";
    import {getLayoutSettings} from "./GraphOptions.js";
    import { useRouter, useRoute } from 'vue-router'

    import { Position, VueFlow, defaultNodeTypes, useVueFlow } from '@vue-flow/core'

    //const { getNode, onNodeClick, onNodeDoubleClick, onNodeDragStop} = useVueFlow()
    const vueFlow = useVueFlow({
        defaultZoom: 0.5,
        maxZoom: 3,
        minZoom: 0.1,
    })

    import ImageNode from './nodes/ImageNode.vue'
    import ProjectNode from './nodes/ProjectNode.vue'
    import ProcessingNode from './nodes/ProcessingNode.vue'
    import PDFNode from './nodes/PDFNode.vue'

    // import * as bootstrap from "bootstrap/dist/js/bootstrap"
    import * as bootstrap from 'bootstrap';
    window.bootstrap = bootstrap;

    const elements = ref([])




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


    const props = defineProps({
        mode: ''
    })


    vueFlow.onNodeDragStop((event) => {
        saveLayout()
    })


    vueFlow.onNodeClick((event) => {
        store.current_node = event.node
    })


    vueFlow.onNodeDoubleClick((event) => {
        if(event.node.type == "project" )
        router.push({ name: 'graph', query: { node: event.node.id.replace('#', '')} })
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

    function updateGraphNode(update) {
        console.log(update)
        cy.nodes().forEach(function( ele ){
            if(ele.id() == update.id) {
                ele.data('name', update.name)
            }
        });
    }

	async function loadGraph(route, oldValue) {
		var layout = ''
        graph.result = []

         if(route.query.node) {

            const query = `MATCH (project:Project)-[r]->(child)
            WHERE id(project) = "#${route.query.node}" 
            OPTIONAL MATCH (child)-[r2*]->(child2)
			RETURN  child, r2, child2`

            graph.result = await web.getGraph(query, route.query.node, CLUSTER)

        
        } else if(route.params.type == 'Project') {
            const query = `MATCH (project:Project)-[r]->(child)
            WHERE id(project) = "#${route.params.id}" 
            OPTIONAL MATCH (child)-[r2*]->(child2)
			RETURN  child, r2, child2`

            graph.result = await web.getGraph(query, route.params.id, CLUSTER)
        }

		drawGraph(layout, route, oldValue)
	}


    async function drawGraph(layout_name, route, oldValue) {

        elements.value = []


        var positions = await getNodePositions()

        for(var node of graph.result.data.nodes) {
            var flownode = {
                id: node.data.id, 
                type: node.data.type.toLowerCase(), 
                data: {
                    label: node.data.name,
                    description: node.data.description
                }
            }
            if(node.data._type)
                flownode.type = node.data._type.toLowerCase()

            if(positions.positions[node.data.id])
                flownode.position = positions.positions[node.data.id]

            if(node.data.image) 
                flownode.data.image = node.data.image
            elements.value.push(flownode)
        }

        for(var node of graph.result.data.edges) {
            var flowedge = {
                id: node.data.id, 
                source: node.data.source,
                target: node.data.target
            }
            elements.value.push(flowedge)
        }
        
        //vueFlow.fitView()
        //var layout = getLayoutSettings(layout_name)
        



		if(props.mode != 'about') {

            // right click expands
            // cy.on('cxttap', "node", async function(event) {

            //     var nodeID = event.target.data().id.replace('#','')

            //     var expandData = await expand(nodeID)
            //     cy.nodes().forEach(function(node){
            //         node.lock()
            //     })

            //     cy.add(expandData)
            //     setGraphOptions('fcose')
            //     cy.nodes().forEach(function(node){
            //         node.unlock()
            //     })

            // });


            // cy.on('dblclick', 'node', async function(evt) {
            //     console.log('öööö')
            //    console.log(evt.target)
            //    console.log(evt.target.data('id'))
            //    console.log(evt.target.data('type'))

            //     if(evt.target.data('type') == 'Project') {
            //         router.push({ name: 'graph', query: { node: evt.target.data('id').replace('#', '')} })
            //     } else if(evt.target.data('type') == 'Set') {
            //             console.log("settiii")
            //             state.setdata = ['testi','toka']
            //             showCanvas()
            //             loadSet(evt.target.data('id'))
                     
            //        // var offcanvas = "offcanvasBottom"
            //     }
            // })


            // cy.on('box', 'node', async function(evt) {

            //     if(evt.target.data('type') == 'File') {
            //         evt.target.addClass("selected")
            //     }
            // })

			// cy.on('oneclick', async function(evt) {
            //     cy.nodes().forEach(function(node){
            //         node.removeClass("selected")
            //     })

            //     if(evt.target.data().id) {
            //         console.log('click')
            //         console.log(evt.target.data().id)
            //             evt.target.addClass("selected")
            //             var nodeID = evt.target.data().id.replace('#','')
            //             console.log(nodeID)
            //             var node = getNodeFromGraph(evt.target.data().id)
            //             if(node) store.current_node = node
            //             else store.current_node = {data: {id: '#' + nodeID}}
            //       } else {
            //           store.current_node = null
            //       }
    		// });

            // cy.on('dragfreeon', 'node', async function(evt) {
            //     //console.log(evt.target.data().id )
            //     if(evt.target.data().id) {
                        
            //             var nodeID = evt.target.data().id.replace('#','')
            //             console.log(nodeID)
            //             var node = getNodeFromGraph(evt.target.data().id)
            //             if(node) store.current_node = node
            //             else store.current_node = {data: {id: '#' + nodeID}}

            //             var pos = evt.target
            //             current_graph_node.position.x = pos.position().x
            //             current_graph_node.position.y = pos.position().y
            //             store.x = pos.position().x
            //             store.y = pos.position().y
            //             // simple align
            //             pos.position({x:Math.round(pos.position().x/50)*50, y:Math.round(pos.position().y/50)*50})
            //             saveLayout()
            //       } else {
            //           store.current_node = null
            //       }
       
            // });
		}

    }


    function fitGraph(id) {
        id = id.replace('#', '')
       // cy.fit(cy.$('node[idc="#' + id.replace(':','_')+'"]'), 250)

// if( cy.zoom() > fitMaxZoom ){
//   cy.zoom( fitMaxZoom );
//   cy.center();
// }
    }





    function setNodePositions(node_layout, layout) {

        if(node_layout.positions) {
            cy.nodes().positions(function( node, i ){
                if(node_layout.positions[node.id()]) {
                    return {
                        x: node_layout.positions[node.id()].x,
                        y: node_layout.positions[node.id()].y
                    };
                }
            });
        }


        // if(layout_name === 'preset' ) {
        //     cy.nodes().positions(function( node, i ){
		// 		console.log(node.data('type'))
		// 			return {
		// 				x: (i % 3) * 130 -500,
		// 				y: (i - (i % 3))/3 * 50 -500
		// 			};
        //     });
        // }
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
            if(node_layout.positions)
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
        //console.log(elements.value)
		var positions = {}
		elements.value.forEach(function(ele){
			positions[ele.id] = ele.position
		})
		if(route.query.node)
			web.saveLayout(positions, route.query.node)
        else if(props.mode == 'projects')
            web.saveLayout(positions, props.mode)
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
           graph.result = await web.getGraph(`MATCH (p:Project) RETURN p`)

            drawGraph('fcose', route)
        }

		//store.queries = await web.getQueries()

	}


	onMounted(async()=> {
		initView()
        console.log(import.meta.env.VITE_PUBLIC_PATH)
	})


</script>
