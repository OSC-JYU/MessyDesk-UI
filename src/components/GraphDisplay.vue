<style>
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

</style>

<template>

  <div id="container" >
		<div class="row h-100" >
			<div class="col-9">
				<div id="cy" class="cy"></div>
			</div>
            <div class="col-3 sidebar p-0 h-100">
                <NodeCard v-if="props.mode == 'graph'" @setGraphOptions="setGraphOptions" @saveLayout="saveLayout" @fitGraph="fitGraph" class="h-100 w-100 position-absolute"/>
                <NavigationCard v-if="props.mode == 'queries'" @setGraphOptions="setGraphOptions" @saveLayout="saveLayout" class="h-100 w-100 position-absolute"/>
                <AboutCard v-if="props.mode == 'about'" class="h-100 w-100 position-absolute"/>
                <StatsCard v-if="props.mode == 'stats'" class="h-100 w-100 position-absolute"/>
                <ListCard v-if="props.mode == 'list'" class="h-100 w-100 position-absolute"/>
            </div>
		</div>

  </div>
</template>


<script setup>
    import cytoscape from "cytoscape";
    import cola from 'cytoscape-cola'
    import fcose from 'cytoscape-fcose';
    import { onMounted, watch, reactive, ref, computed } from "vue";
    import web from "../web.js";
    import NodeCard from "./NodeCard.vue";

    import NavigationCard from './NavigationCard.vue'
    import StatsCard from './StatsCard.vue'
    import ListCard from './ListCard.vue'
    import AboutCard from './AboutCard.vue'
    import {store} from "./Store.js";
    import {getLayoutSettings} from "./GraphOptions.js";
    import { useRouter, useRoute } from 'vue-router'
    import cyCanvas from 'cytoscape-canvas';

    cyCanvas(cytoscape); // Register extension



    cytoscape.use( cola );
    cytoscape.use( fcose );

	const CLUSTER = 1

    const route  = useRoute();
    const router = useRouter();

	//const offCanvas = ref(null)

    var current_node = reactive({})
    var current_graph_node = reactive({position: {}})
    var graph = reactive({result:[]})
    var schema = reactive({result:[]})
	var tags = reactive({result:[]})
    var me = reactive({data:{}})
    var editing = ref(false)
    let cy

    const props = defineProps({
        mode: ''
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
        // var node = cy.nodes("[id = '" + update.id + "']");
        // console.log(node)
        // console.log(typeof node)
        // //var node = getNodeFromGraph(update.id)
        // node.data('name', 'jota')
        // node.removeClass("selected")
    }

	async function loadGraph(route, oldValue) {
		var layout = ''
        graph.result = []

        //console.log('ROUTE MUUTTUI lista')
        //graph.result = await web.getGraph(`MATCH (p:Project) WHERE id(p) = "#${route.params.id}" OPTIONAL MATCH (p)-[r]-(t) RETURN p,r,t`)
        //console.log(graph.result)


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
		// } else if(route.query.tag) {

        //     var tags = JSON.parse(JSON.stringify(store.tags))
		// 	var t = tags.find(x => x['@rid'] == '#'+route.query.tag)

        //     if(t) {
    	// 		var tagged_relations = await web.rawQuery(`match (s)-[r]->(t) where "${t.id}" in r.tags return type(r) as rel`)
    	// 		var rels = []
    	// 		for(var rel of tagged_relations.result) {
    	// 			rels.push(rel.rel)
    	// 		}if(rels.length) {
        //             graph.result = await web.getGraph(`MATCH  (s)-[r:${rels.join('|:')}]->(t) WHERE not s:Schema return s,r,t, t.label as l`)
        //             if(t.layout) layout = t.layout
        //         } else {
        //             graph.result.data = {nodes:[], edges:[]}
        //         }

        //     }

		// } else if (route.query.type) {
		// 	var t = store.schemas.find(x => x.rid == '#' + route.query.type)
		// 	graph.result = await web.getGraph(`MATCH (p:${t.label}) OPTIONAL MATCH (p)-[r]-(t) RETURN p,r,t`)

		// } else if (route.query.query) {
        //     var Q = await web.getNodeAttributes(route.query.query)
		// 	console.log(Q[0].layout)
        //     if(Q[0].layout) layout = Q[0].layout
		// 	graph.result = await web.getGraph(Q[0].query)
        //     //store.current_node = {data: {name:"ss", id:"#429:0"}}

		// } else if (route.query.cluster) {
		// 	var splitted = route.query.cluster.split('__')
		// 	var source = '#' + splitted[0]
		// 	var rel = splitted[1]
		// 	graph.result = await web.getGraph(`MATCH (p) WHERE id(p) = "${source}" OPTIONAL MATCH (p)-[r:${rel}]-(t) RETURN p,r,t`)

		// } else if (route.query.map) {
        //     console.log('map')
        //     graph.result = await web.getGraph(`MATCH (node)-[r]-(map:QueryMap) WHERE id(map) = "#${route.query.map}" RETURN node`)
        //     store.current_node = {data:{id:route.query.map, type: 'QueryMap', type_label: 'Kartta'}}
        // }

		drawGraph(layout, route, oldValue)
	}


    async function drawGraph(layout_name, route, oldValue) {

        var layout = getLayoutSettings(layout_name)
        var positions = await getNodePositions()
console.log(props.mode)
        // schema has common layout for all users
        if(positions && (['schema', 'queries'].includes(props.mode))) {
            console.log(props.mode)
           layout = getLayoutSettings('preset')
           setUserPositions(positions)

        } else if(positions && store.current_node.data) {
            // if all nodes has user position, then use layout "preset"
            // otherwise use "fcose" with "fixedNodeConstraint"
            // TODO figure out why fixedNodeConstraint does not work
           layout = getLayoutSettings('preset')
           var nonPositionedNodes = setUserPositions(positions)
           // console.log(nonPositionedNodes)
           // if(nonPositionedNodes > 0) {
           //     console.log('using fcose')
           //     layout = getLayoutSettings('fcose')
           //     layout.layout.fixedNodeConstraint = setFixedNodeConstraint(positions)
           // }

        }
		if(!graph.result.data || (graph.result.data.nodes && !graph.result.data.nodes.length)) {
            graph.result.data = {}
			graph.result.data.nodes = [{ data: {id:"not found", name:"not found", type_label:"empty", type:"empty", active: true}}]

		}


        const elem = document.getElementById("cy");
        elem.replaceChildren();

        //cytoscape.warnings(false)
    	cy = cytoscape({
    	  container: document.getElementById("cy"),
    	  boxSelectionEnabled: true,
    	  autounselectify: true,
    	  wheelSensitivity: 0.2,
    	  style: store.graph_style,

    	  elements: {
    		nodes: graph.result.data.nodes,
    		edges: graph.result.data.edges,
    	  },
		  layout: layout.layout
    	});



		if(props.mode != 'about') {

            // right click expands
            cy.on('cxttap', "node", async function(event) {

                var nodeID = event.target.data().id.replace('#','')

                var expandData = await expand(nodeID)
                cy.nodes().forEach(function(node){
                    node.lock()
                })

                cy.add(expandData)
                setGraphOptions('fcose')
                cy.nodes().forEach(function(node){
                    node.unlock()
                })

            });


            cy.on('dblclick', 'node', async function(evt) {
               console.log(evt.target)
               console.log(evt.target.data('id'))

                if(evt.target.data('type') == 'Project') {
                    router.push({ name: 'graph', query: { node: evt.target.data('id').replace('#', '')} })
                }
            })


            cy.on('box', 'node', async function(evt) {

console.log('box')
                if(evt.target.data('type') == 'File') {
                    evt.target.addClass("selected")
                }
            })

			cy.on('oneclick', async function(evt) {
                cy.nodes().forEach(function(node){
                    node.removeClass("selected")
                })

                if(evt.target.data().id) {
                    console.log('click')
                    console.log(evt.target.data().id)
                        evt.target.addClass("selected")
                        var nodeID = evt.target.data().id.replace('#','')
                        console.log(nodeID)
                        var node = getNodeFromGraph(evt.target.data().id)
                        if(node) store.current_node = node
                        else store.current_node = {data: {id: '#' + nodeID}}
                  } else {
                      store.current_node = null
                  }
    		});

            cy.on('dragfreeon', 'node', async function(evt) {
                //console.log(evt.target.data().id )
                if(evt.target.data().id) {
                        
                        var nodeID = evt.target.data().id.replace('#','')
                        console.log(nodeID)
                        var node = getNodeFromGraph(evt.target.data().id)
                        if(node) store.current_node = node
                        else store.current_node = {data: {id: '#' + nodeID}}

                        var pos = evt.target
                        current_graph_node.position.x = pos.position().x
                        current_graph_node.position.y = pos.position().y
                        store.x = pos.position().x
                        store.y = pos.position().y
                        // simple align
                        pos.position({x:Math.round(pos.position().x/100)*100, y:Math.round(pos.position().y/100)*100})
                        saveLayout()
                  } else {
                      store.current_node = null
                  }
       
            });
		}

    }

    function fitGraph(id) {
        id = id.replace('#', '')
        cy.fit(cy.$('node[idc="#' + id.replace(':','_')+'"]'), 250)

// if( cy.zoom() > fitMaxZoom ){
//   cy.zoom( fitMaxZoom );
//   cy.center();
// }
    }




    function clear(ctx, options) {
        const width = cy.width();
        const height = cy.height();
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width * options.pixelRatio, height * options.pixelRatio);
        ctx.restore();
    }

    function resetTransform(ctx, options) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    function setTransform(ctx, options) {
        const pan = cy.pan();
        const zoom = cy.zoom();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(pan.x * options.pixelRatio, pan.y * options.pixelRatio);
        ctx.scale(zoom * options.pixelRatio, zoom * options.pixelRatio);
    }


    function setDraw(image) {

        //var layer = cy.cyCanvas();
        const layer = cy.cyCanvas({
          zIndex: 1
        });
        var canvas = layer.getCanvas();
        var ctx = canvas.getContext('2d');

        cy.on("render cyCanvas.resize", function(evt) {
            layer.resetTransform(ctx);
            layer.clear(ctx);


            layer.setTransform(ctx);

             ctx.save();
             // Draw a background
             ctx.drawImage(image, 0, 0);

            // Draw fixed elements
            //ctx.fillRect(0, 0, 100, 100); // Top left corner

            //layer.setTransform(ctx);
            let circle = new Path2D();  // <<< Declaration
            circle.arc(100, 100, 45, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'blue';
            ctx.fill(circle);
            // Draw model elements
            //var n = getRandomIntInclusive(0,10)
            cy.nodes().forEach(function(node) {
                var pos = node.position();
                ctx.fillRect(pos.x, pos.y, 100, 100); // At node position
            });
            // ctx.restore();
        });

    }


    function getRandomIntInclusive(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
    }

    //
    async function expand(nodeID) {
        var response = await web.getGraph(`match (s)-[r]-(t) WHERE id(s) = "#${nodeID}" RETURN s,r,t`)
        //graph.result.data.nodes = graph.result.data.nodes.concat(response.data)
        return response.data
    }

	async function showSchemas() {
		graph.result = await web.getGraph(`match (s:Schema)-[r]-(s2:Schema) WHERE NOT s._type IN ["Menu", "Query", "UserGroup", "Tag", "NodeGroup"] return s,r,s2`)
		drawGraph('fcose', route)
	}

    async function showNavigation() {
		graph.result = await web.getGraph(`match (s) WHERE s:Query OR s:Menu OR s:UserGroup  OPTIONAL MATCH (s)-[r]-(p) OPTIONAL MATCH (p)-[r2]-(group) return s,p, r, group, r2`)
		drawGraph('fcose', route)
	}

    async function showQueries() {
		graph.result = await web.getGraph(`match (s:Query) return s`)
		drawGraph('fcose', route)
	}

	function getNodeFromGraph(nodeID) {
		var current = null
        if(nodeID.startsWith('#')) nodeID = nodeID.replace('#','')
		for(var node of graph.result.data.nodes) {
			if(node.data.id == '#' + nodeID) current = node
		}
		return current
	}

	function setUserPositions(node_layout) {
        var nonPositionedNodes = 0
		for( var node of graph.result.data.nodes) {
            if(node_layout.positions[node.data.id]) {
                node.position = {
                    x: node_layout.positions[node.data.id].x,
                    y: node_layout.positions[node.data.id].y
                }
            } else {
                nonPositionedNodes++
            }
		}
        return nonPositionedNodes
	}

    function setFixedNodeConstraint(node_layout, layout) {

        //{nodeId:"#528:7", position: {x:-500, y:0}}
        var out = []
        if(node_layout.positions) {
            for(var node in node_layout.positions) {
                var id = node.replace('node','#').replace('_',':')
                out.push({nodeId: id, position: {x: node_layout.positions[node].x, y: node_layout.positions[node].y}})
            }
        }
        console.log(out)
        return out
    }

    function setNodePositions(node_layout, layout) {

        if(node_layout.positions) {
            cy.nodes().positions(function( node, i ){
                console.log(node.id())
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
        else if(route.query.tag)
            node = route.query.tag
        else if(route.query.cluster)
            node = route.query.cluster
        else if(props.mode == 'schema' || props.mode == 'queries')
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
		var positions = {}
		cy.nodes().forEach(function(ele){
			if(!ele.isParent())
				positions[ele.id()] = ele.position()
		})
		if(route.query.node)
			web.saveLayout(positions, route.query.node)
		else if(route.query.query)
			web.saveLayout(positions, route.query.query)
        else if(route.query.tag)
			web.saveLayout(positions, route.query.tag)
		else if(route.query.cluster)
			web.saveLayout(positions, route.query.cluster)
        else if(props.mode == 'schema' || props.mode == 'queries')
            web.saveLayout(positions, props.mode)
	}

	function initAbout() {
		graph.result.data = {
			nodes: [
				{ data: { id: 'project1', name:"Digital humanities in school", type:"Project", type_label:"Project", active: true } },
	
				{ data: { id: 'sad_tale', name:"sad_tale.pdf", _type: "pdf", type_label:"File", active: true} },
				{ data: { id: 'extract_text', name: "Extract text", type:"Process", type_label:"Process", active: true } },
				{ data: { id: 'sad_tale_txt', name: "sad_tale.txt", _type:"text", type_label:"File", active: true  } },
                { data: { id: 'sad_tale_image', name: "saddist.jpg", _type:"image", type_label:"File", active: true  } },
                { data: { id: 'sad_tale_illustration', name: "sad.jpg", _type:"image", type_label:"File", active: true  } },
                { data: { id: 'extract_images', name: "Extract images", type:"Process", type_label:"Process", active: true } },

			],
			edges: [
				{ data: { source: 'sad_tale', target: 'project1', label:"IS PART OF", active: true } },
				{ data: { source: 'sad_tale', target: 'extract_text', label:"WAS PROCESSED BY", active: true } },
				{ data: { source: 'sad_tale_txt', target: 'extract_text', label:"WAS PRODUCED BY", active: true } },
                { data: { source: 'sad_tale', target: 'extract_images', label:"WAS PROCESSED BY", active: true } },
                { data: { source: 'sad_tale_image', target: 'extract_images', label:"WAS_PRODUCED_BY", active: true } },
                { data: { source: 'sad_tale_illustration', target: 'extract_images', label:"WAS_PRODUCED_BY", active: true } },

			]
		}

	}



	async function initView() {

        if(!store.user) store.user = await web.getMe()
        //if(store.schemas.length == 0) store.schemas = await web.getSchemas()
        //if(store.tags.length == 0) store.tags = await web.getTags()
        if(store.graph_style.length == 0) store.graph_style = await web.getStyle()

		if(!props.mode && route.path == '/' ) {
			router.push({ name: 'graph', query: {}})

		} else if(props.mode == 'graph') {
            console.log('GRAPH')

			if(route.query.node || route.query.type || route.query.query) {
				loadGraph(route)
			} else {
				// show user's graph by default
				me.data = await web.getMe()
                
			}

        } else if(props.mode == 'schema') {
            if(route.query.node) {
                loadGraph(route)
			} else {
                store.current_node = {}
    			await showSchemas()
            }

		} else if(props.mode == 'queries') {
			showNavigation('fcose')

		} else if(props.mode == 'about') {
			initAbout()
			drawGraph('fcose', route)

		} else if(props.mode == 'maps') {
			loadGraph(route)

		} else if(props.mode == 'list') {
           graph.result = await web.getGraph(`MATCH (p:Project) RETURN p`)

            drawGraph('fcose', route)
        }

		store.queries = await web.getQueries()

	}

	onMounted(async()=> {
		initView()
        console.log(import.meta.env.VITE_PUBLIC_PATH)
	})


</script>
