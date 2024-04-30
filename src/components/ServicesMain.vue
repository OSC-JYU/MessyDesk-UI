<style scoped>
    .enabled {
        background-color: greenyellow;
        color: black;
        margin:2px;
    }
    .disabled {
        background-color: pink;
        color: black;
        margin:2px;
    }
    .has {
        background-color: rgb(163, 166, 237);
        color: black;
        margin:2px;
    }
</style>

<script setup>
    import { Position, VueFlow, defaultNodeTypes, useVueFlow } from '@vue-flow/core'
    import { Background } from '@vue-flow/background'

    import { onMounted, reactive, nextTick, markRaw } from "vue";
    import ProcessingNode from './nodes/ProcessingNode.vue'
    import JYUHeader from './JYUHeader.vue'
    import web from "../web.js";

        //const { getNode, onNodeClick, onNodeDoubleClick, onNodeDragStop} = useVueFlow()
    const flow = useVueFlow({
        defaultZoom: 0.2,
        maxZoom: 3,
        minZoom: 0.1,
    })

    const nodeTypes = {
  custom: markRaw(ProcessingNode),
}

    var state = reactive({
        services: [],
        nodes: [  
            { id: 'md_api', label: 'MessyDesk API', position: { x: 200, y: 50 }, class: 'light' },
            { id: 'md_ui',  label: 'MessyDesk UI', position: { x: 50, y: 0 }, class: 'light' },
            { id: 'db', type: 'output', label: 'ArcadeDB', position: { x: 100, y: 100 }, class: 'light' },
            { id: 'nats', label: 'NATS Jetstream', position: { x: 400, y: 100 }, class: 'light' },
            { id: 'nomad', label: 'Nomad', position: { x: 150, y: 200 }, class: 'light' },

            { id: 'image', label: 'Image services', position: { x: 0, y: 200 }, type:'processing', data: {label:'Image services'} },
            { id: 'text', label: 'Text services', position: { x: 150, y: 200 } },
            { id: 'pdf', label: 'PDF services', position: { x: 300, y: 200 } }
        ],

        edges: [
        { id: 'md', source: 'md_api', target: 'md_ui', animated: true, label: 'test' }
        ],
    })

    document.title = "MessyDesk - services"

    async function enable(adapter_ID) {
        console.log(adapter_ID)
    }

    onMounted(async()=> {
        var response = await web.getServices()
        var data = {'text':[], 'pdf':[], 'image':[]}
        for(var s in response) {
            console.log(response[s]['supported_types'])
            for(var mediatype of response[s]['supported_types']) {
                data[mediatype].push(response[s])
               // state.nodes.push({id: response[s].id, label: response[s].id, position: { x: 0, y: count * 50 }, parentNode: mediatype, class: 'light', expandParent: true})
                count++
            }
        }

        for(var mediatype in data) {
            var count = 1
            for(var item in data[mediatype]) {
                state.nodes.push({id: data[mediatype][item].id, label: data[mediatype][item].id, position: { x: 0, y: count * 50 }, class: 'light', parentNode: mediatype, expandParent: true})
                count++
            }
            //
            count++
        }
        state.services = data
        nextTick(() => {
            flow.fitView()
        })
    })

</script>



<template>
    <div class="vh-100 container-fluid m-0 p-0">
        <div class="row  h-100  w-100 m-0 p-0">
            <div class="col-12 m-0 p-0">
                <div class="h-100 d-flex flex-column w-100 m-0 p-0">
                    <div class="row justify-content-center m-0 p-0">
                        <JYUHeader/>
                    </div>

                    <VueFlow :nodes="state.nodes" :edges="state.edges" fit-view-on-init>
                        <Background />
                        <template #node-processing="{ data }">
                            <ProcessingNode :data="data" />
                        </template>
                        </VueFlow>


 
                </div>
            </div>
        </div>
    </div>
</template>
