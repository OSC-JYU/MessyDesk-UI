import dagre from 'dagre'
import { Position, useVueFlow } from '@vue-flow/core'
import { ref } from 'vue'

/**
 * Composable to run the layout algorithm on the graph.
 * It uses the `dagre` library to calculate the layout of the nodes and edges.
 */
export function useLayout() {
  const { findNode } = useVueFlow()

  const graph = ref(new dagre.graphlib.Graph())

  const previousDirection = ref('LR')

  function layout(nodes, edges, direction) {
    console.log(nodes)
    // we create a new graph instance, in case some nodes/edges were removed, otherwise dagre would act as if they were still there
    const dagreGraph = new dagre.graphlib.Graph()

    graph.value = dagreGraph

    dagreGraph.setDefaultEdgeLabel(() => ({}))

    const isHorizontal = direction === 'LR'
    dagreGraph.setGraph({ rankdir: direction , nodesep: 200, ranksep: 200})

    previousDirection.value = direction

    for (const node of nodes) {
      console.log('node.id:', node.id)
      // if you need width+height of nodes for your layout, you can use the dimensions property of the internal node (`GraphNode` type)
      //const graphNode = findNode(node.id)

        //dagreGraph.setNode(node.id, { width: graphNode.dimensions.width || 200, height: graphNode.dimensions.height || 200 })

        dagreGraph.setNode(node.id, { width:  200, height:  200 })
      
    }

    for (const edge of edges) {
      dagreGraph.setEdge(edge.source, edge.target)
    }

    dagre.layout(dagreGraph)

    // set nodes with updated positions
    return nodes.map((node) => {
      console.log(node.id)
      const nodeWithPosition = dagreGraph.node(node.id)

      return {
        ...node,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
      }
    })
  }

  return { graph, layout, previousDirection }
}
