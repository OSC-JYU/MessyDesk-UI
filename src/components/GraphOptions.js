
import cytoscape from "cytoscape";

export const getLayoutSettings = function(layout_name) {
    if(!layout_name)
        return layouts['fcose']
    else
        return layouts[layout_name]
}


const positions = {}

const layouts = {
    preset: {
        layout: {
            name: "preset",
            fit: true
        }
    },
    grid: {
        layout: {
            name: "grid",
            fit: true
        }
    },
    circle: {
        layout: {
            name: "circle",
            fit: true
        }
    },
    cose: {
        layout: {
            name: "cose",
            spacingFactor: 1.5,
            avoidOverlap: true,
            fit: true
        }
    },

    fcose: {
        layout: {
            name: "fcose",
            fit: true,
            animate: false,
            quality: "proof",
            randomize: true,
            nodeSeparation:220,
            idealEdgeLength: edge => 220
            // fixedNodeConstraint: [
            //     {nodeId:"#528:7", position: {x:-500, y:0}},
            //     {nodeId:"#447:0", position: {x:0, y:0}}
            // ]
        }
    },


    cola: {
        layout: {
            name: "cola",
            animate: false,
            spacingFactor: 1.5,
            rankDir: "LR",
            fit: true,

            avoidOverlap: true,
            nodeDimensionsIncludeLabels: true,
            nodeSpacing: function( node ){ return 30; },
            idealEdgeLength: function (edge) {
                switch (edge.data().type) {
                    case 1 :
                        return 30;
                    case 2 :
                    case 3 :
                        return 120;
                    case 0 :
                    default :
                        return 45;
                }
            },
            edgeElasticity: function (edge) {
                switch (edge.data().type) {
                    case 1 :
                        return 50;
                    case 2 :
                    case 3 :
                        return 200;
                    case 0 :
                    default :
                        return 100;
                }
            },
            nestingFactor: 1.2,
            initialTemp: 1000,
            coolingFactor: 0.99,
            minTemp: 1.0,
            gravity: 1.4
        }
    }
}
