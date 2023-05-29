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

</style>

<template>

  <div id="container" >
		<div class="row vh-100" >
			<div class="col-8">
                <div class="btn-group" role="group" >
                    <!--<button class="btn" @click="setGraphOptions('cose')">cose</button>-->
                    <button class="btn" title="layout cose" @click="setGraphOptions('cose')">A1</button>
                    <button class="btn" title="layout cola" @click="setGraphOptions('cola')">A2</button>
                    <button class="btn" title="layout fcose" @click="setGraphOptions('fcose')">A3</button>
                    <button class="btn" title="layout grid" @click="setGraphOptions('grid')">grid</button>
                    <button class="btn" title="tallettamasi asettelu" @click="setGraphOptions('preset')">oma</button><br>
                    <button @click="saveLayout()" class="btn btn-secondary ">talleta asettelu</button>

                </div>

				<div id="cy" class="cy" :class="props.mode"></div>
			</div>

			<div class="col-4 sidebar">

				<NodeCard v-if="props.mode == 'graph'"/>
				<SchemaCard v-if="props.mode == 'schema'"/>
                <NavigationCard v-if="props.mode == 'queries'"/>
                <MapCard v-if="props.mode == 'maps'"/>
				<AboutCard v-if="props.mode == 'about'"/>

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
    import SchemaCard from './SchemaCard.vue'
    import NavigationCard from './NavigationCard.vue'
    import MapCard from './MapCard.vue'
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

	const offCanvas = ref(null)

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
				loadGraph(route, oldValue)
			} else {
				if(route.path == 'graph') {
					me.data = await web.getMe()
               		router.push({ name: 'graph', query: { node: me.data.rid.replace('#', '') } })
				} else {
					initView()
				}
			}
	})


    watch(
    	() => store.update,
      	async (newValue, oldValue) => {
        	loadGraph(route)
    })


	async function loadGraph(route, oldValue) {
		var layout = ''
        graph.result = []

		if(route.query.node) {
            if(route.query.node == 'me') {
                me.data = await web.getMe()
                router.push({ name: 'graph', query: { node: me.data.rid.replace('#', '') } })
            } else {
				graph.result = await web.getGraph(`MATCH (p) WHERE id(p) = "#${route.query.node}" OPTIONAL MATCH (p)-[r]-(t) RETURN p,r,t`, route.query.node, CLUSTER)
        		store.current_node = getNodeFromGraph(route.query.node)
			}

		} else if(route.query.tag) {

            var tags = JSON.parse(JSON.stringify(store.tags))
			var t = tags.find(x => x['@rid'] == '#'+route.query.tag)

            if(t) {
    			var tagged_relations = await web.rawQuery(`match (s)-[r]->(t) where "${t.id}" in r.tags return type(r) as rel`)
    			var rels = []
    			for(var rel of tagged_relations.result) {
    				rels.push(rel.rel)
    			}if(rels.length) {
                    graph.result = await web.getGraph(`MATCH  (s)-[r:${rels.join('|:')}]->(t) WHERE not s:Schema return s,r,t, t.label as l`)
                    if(t.layout) layout = t.layout
                } else {
                    graph.result.data = {nodes:[], edges:[]}
                }

            }

		} else if (route.query.type) {
			var t = store.schemas.find(x => x.rid == '#' + route.query.type)
			graph.result = await web.getGraph(`MATCH (p:${t.label}) OPTIONAL MATCH (p)-[r]-(t) RETURN p,r,t`)

		} else if (route.query.query) {
            var Q = await web.getNodeAttributes(route.query.query)
			//console.log(Q)
			graph.result = await web.getGraph(Q[0].query)
            //store.current_node = {data: {name:"ss", id:"#429:0"}}

		} else if (route.query.cluster) {
			var splitted = route.query.cluster.split('__')
			var source = '#' + splitted[0]
			var rel = splitted[1]
			graph.result = await web.getGraph(`MATCH (p) WHERE id(p) = "${source}" OPTIONAL MATCH (p)-[r:${rel}]-(t) RETURN p,r,t`)

		} else if (route.query.map) {
            console.log('map')
            graph.result = await web.getGraph(`MATCH (node)-[r]-(map:QueryMap) WHERE id(map) = "#${route.query.map}" RETURN node`)
            store.current_node = {data:{id:route.query.map, type: 'QueryMap', type_label: 'Kartta'}}
        }

		drawGraph(layout, route, oldValue)
	}


    async function drawGraph(layout_name, route, oldValue) {
        console.log(layout_name)
        const oneClickExpand = false
        var layout = getLayoutSettings(layout_name)

		//var graphStyle = await web.getStyle()
        var positions = await getNodePositions()
        if(positions && store.current_node.data.type !== 'QueryMap') {
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

        if(store.current_node && store.current_node.data && store.current_node.data.type == 'QueryMap') {
            // remove edges from map view since they make map messy
            graph.result.data.edges = []
            // get node positions from relationship attributes
            await setMapPositions()
            layout = getLayoutSettings('preset')
        }

        // update graph
        cy.elements().remove()
        cy.add({nodes:graph.result.data.nodes, edges: graph.result.data.edges})
        var v = cy.layout(layout.layout)
        v.run()
        //const elem = document.getElementById("cy");
        //elem.replaceChildren();

        //cytoscape.warnings(false)




		if(props.mode != 'about') {
            cy.on('dblclick', 'node', async function(evt) {
				if(evt.target.data('type') == 'Cluster') {
					router.push({ name: props.mode, query: { cluster: this.id().replace('#', '') } })
				} else if(evt.target.data('type') == 'QueryMap') {
                    router.push({ name: props.mode, query: { map: this.id().replace('#', '')} })
                } else {
                	router.push({ name: props.mode, query: { node: this.id().replace('#', '') } })
				}
            })
			cy.on('click', 'node', async function(evt) {

                var nodeID = evt.target.data().id.replace('#','')
				console.log(nodeID)
				//router.push({ name: props.mode, query: { node: this.id().replace('#', '') } })

                if(oneClickExpand) {
                    var elements = {
                        nodes: [{data:{id: 'koe', name:'koe', active: true}}],
                        edges: [{data: {id:'2', source:'koe', target:'#522:0'}}]
                    }
                    var expandData = await expand(nodeID)
                    // cy.nodes().forEach(function(node){
                    // 	node.lock()
                    // })

                    cy.add(expandData)
                    setGraphOptions('fcose')
                    // cy.nodes().forEach(function(node){
                    //     node.unlock()
                    // })
                }

                //graph.result = await web.getGraph(`MATCH (p) WHERE id(p) = "#${nodeID}" OPTIONAL MATCH (p)-[r]-(t) RETURN p,r,t`, nodeID)
                  store.current_node = getNodeFromGraph(evt.target.data().id)
    		});

            cy.on('dragfreeon', 'node', async function(evt) {
                //console.log(evt.target.data().id )
                var pos = cy.nodes("[id = '" + evt.target.data().id + "']");
                //console.log('dragfreeon')
                console.log(pos.position())
                current_graph_node.position.x = pos.position().x
                current_graph_node.position.y = pos.position().y
                store.x = pos.position().x
                store.y = pos.position().y
                //console.log(current_graph_node)
            });
		}

        // if QueryMap, then draw background image and lock nodes
        if(store.current_node.data.type == 'QueryMap') {
            setBackground()
            cy.nodes().forEach(function(node) {
                node.lock();
            });
            if(props.mode == 'maps') {
                cy.nodes().forEach(function(node) {
                    if(node.id() != '#' + route.query.focus)
                        node.data('active', false)
                    else {
                        node.unlock()
                    }
                });
            }
            if(oldValue && oldValue.node) {
                cy.fit(cy.$('node[idc="#' + oldValue.node.replace(':','_')+'"]'), 250)
            } else if(route.query.focus) {
                cy.fit(cy.$('node[idc="#' + route.query.focus.replace(':','_')+'"]'), 250)
            }

        }
    }

    function fitGraph(id) {
        cy.fit(cy.$('node[idc="#' + id.replace(':','_')+'"]'), 250)
    }

    async function setMapPositions() {
        var coords = await web.rawQuery('MATCH (n)-[r]-(map:QueryMap) RETURN r._x as x, r._y as y, id(n) as id')
        console.log(coords)
        // loop through the nodes and check if position on the map is found
        for(var node of graph.result.data.nodes) {
            var id = node.data.id
            node.position = {x: 10.0, y: 2.0}
            //node.data.parent = 'outlaws'
            // console.log(id)
            var found = false
            for(var position of coords.result) {
                if(position.id == id && position.x != '  cypher.null') {
                    node.position = {x: position.x, y: position.y}
                    found = true
                }
            }
            if(!found) {
                node.style = {'background-color': 'red'}
            }
        }
        //graph.result.data.nodes.push({data:{id:'outlaws', name:'outlaws'}})

        // cy.nodes().forEach(function(node) {
        //     node.lock();
        // });
    }

    function setBackground() {
        var myElement = cy.container()
        const image = new Image(60, 45); // Using optional size for image
        image.onload = setDrawNative(image) // Draw when image has loaded

        // Load an image of intrinsic size 300x227 in CSS pixels
        image.src = "pohjakaava.jpg";
    }

    function setDrawNative(image) {
        const container = cy.container();

        const canvas = document.createElement("canvas");
        canvas.setAttribute("id", "Map");

        container.firstChild.appendChild(canvas);

        const defaults = {
            zIndex: 0,
            pixelRatio: "auto",
        };

        const options = Object.assign({}, defaults);

        if (options.pixelRatio === "auto") {
            options.pixelRatio = window.devicePixelRatio || 1;
        }

        function resize() {
            const width = container.firstChild.offsetWidth;
            const height = container.firstChild.offsetHeight;
            console.log(container.firstChild.offsetHeight)
            //const width = 997
            //const height = 770

            const canvasWidth = width * options.pixelRatio;
            const canvasHeight = height * options.pixelRatio;

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;

            cy.trigger("cyCanvas.resize");
        }

        cy.on("resize", () => {
            resize();
        });

        canvas.setAttribute(
            "style",
            `position:absolute; top:0; left:0; z-index:${options.zIndex};`,
        );

        var ctx = canvas.getContext('2d');

        cy.on("render cyCanvas.resize", function(evt) {
            resetTransform(ctx, options);
            clear(ctx, options);


            setTransform(ctx, options);

             ctx.save();
            ctx.drawImage(image, image.width*25*-1, image.height*25*-1, image.width*50, image.height*50);
        })
        resize();

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
        return response.data
    }

	async function showSchemas() {
		graph.result = await web.getGraph(`match (s:Schema) return s`)
		drawGraph('fcose')
	}

    async function showNavigation() {
		graph.result = await web.getGraph(`match (s:Query) OPTIONAL MATCH (s)-[]-(p) OPTIONAL MATCH (p)-[]-(group) return s,p, group`)
		drawGraph('fcose')
	}

    async function showQueries() {
		graph.result = await web.getGraph(`match (s:Query) return s`)
		drawGraph('fcose')
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
            var id = node.data.id.replace('#','node').replace(':','_')
            if(node_layout.positions[id]) {
                node.position = {
                    x: node_layout.positions[id].x,
                    y: node_layout.positions[id].y
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
                //console.log(node.data('type'))
                var id = node.id().replace('#','node').replace(':','_')
                if(node_layout.positions[id]) {
                    return {
                        x: node_layout.positions[id].x,
                        y: node_layout.positions[id].y
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

        if(node) {
            var node_layout = await web.getLayoutByTarget(node)
            if(node_layout.positions)
            return node_layout
        }
        return 0
    }

	async function setGraphOptions(layout_name) {

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
	}

	function initAbout() {
		graph.result.data = {
			nodes: [
				{ data: { id: 'cat', name:"Mirri", type:"Cat", type_label:"Kissa", active: true } },
				{ data: { id: 'dog', name:"Musti", type:"Dog", type_label:"Koira", active: true } },
				{ data: { id: 'bird', name:"I'm innocent little bird", type: "Bird", type_label:"Lintu", active: true} },
				{ data: { id: 'person1', name: "Kuka Kukako", type:"Person", type_label:"Henkilö", active: true } },
				{ data: { id: 'person2', name: "Sima Kukako", type:"Person", type_label:"Henkilö", active: true  } },
				{ data: { id: 'person3', name: "Joku Kukako", type:"Person", type_label:"Henkilö", active: true  } },
				{ data: { id: 'db1', name: "Dog Shit database", type:"Database", type_label:"Tietokanta", active: true  } },
				{ data: { id: 'journal', name: "Shit&Fans", type:"Journal", type_label:"Lehti", active: true  } },
				{ data: { id: 'article', name: "Origin of Poo", type:"Article", type_label:"Artikkeli", active: true  } },
			],
			edges: [
				{ data: { source: 'cat', target: 'bird', label:"EATS", active: true } },
				{ data: { source: 'person1', target: 'cat', label: "SORT OF OWNS", active: true } },
				{ data: { source: 'cat', target: 'person1', label: "OWNS", active: true } },
				{ data: { source: 'person1', target: 'dog', label: "OWNS", active: true } },
				{ data: { source: 'person1', target: 'dog', label: "LOVES", active: true } },
				{ data: { source: 'person2', target: 'dog', label: "IS SCARED OF", active: true } },
				{ data: { source: 'dog', target: 'cat', label: "IS SCARED OF", active: true } },
				{ data: { source: 'person2', target: 'db1', label: "UPDATES", active: true } },
				{ data: { source: 'person2', target: 'db1', label: "OWNS", active: true } },
				{ data: { source: 'person2', target: 'article', label: "IS_AUTHOR_OF", active: true } },
				{ data: { source: 'article', target: 'journal', label: "IS_PUBLISHED_IN", active: true } },
				{ data: { source: 'person3', target: 'journal', label: "PUBLISHES", active: true } },
				{ data: { source: 'person1', target: 'journal', label: "IS SUBSCRIBER", active: true } },
				{ data: { source: 'person1', target: 'person2', label: "IS FATHER OF", active: true } },
			]
		}

	}



	async function initView() {

        var layout = getLayoutSettings('fcose')

		var graphStyle = await web.getStyle()

        cy = cytoscape({
    	  container: document.getElementById("cy"),
    	  boxSelectionEnabled: false,
    	  autounselectify: true,
    	  wheelSensitivity: 0.2,
    	  style: graphStyle,

    	  elements: {
    		nodes: [],
    		edges: [],
    	  },
		  layout: layout.layout
    	});

		console.log(route.path)
        //store.tags = await web.getTags()
        store.schemas = await web.getSchemas()
        store.tags = await web.getTags()
		if(route.path == '/') {
			router.push({ name: 'graph', query: {}})
		} else if(props.mode == 'graph') {

			if(route.query.tag || route.query.node || route.query.type || route.query.query || route.query.cluster || route.query.map) {
				loadGraph(route)
			} else {
				// show user's graph by default
				me.data = await web.getMe()
				router.push({ name: props.mode, query: { node: me.data.rid.replace('#', '') } })
			}
        } else if(props.mode == 'schema') {
			store.current_node = {}
			await showSchemas()
		} else if(props.mode == 'queries') {
			showNavigation('fcose')
		} else if(props.mode == 'about') {
			initAbout()
			drawGraph('fcose')
		} else if(props.mode == 'maps') {
			loadGraph(route)
		}

		store.queries = await web.getQueries()

	}

	onMounted(async()=> {
		initView()
	})


</script>
