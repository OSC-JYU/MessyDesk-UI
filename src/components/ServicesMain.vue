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
    import JSONNode from './nodes/JSONNode.vue'
    import ImageNode from './nodes/ImageNode.vue'
    import TextNode from './nodes/TextNode.vue'
    import PDFNode from './nodes/PDFNode.vue'
    import JYUHeader from './JYUHeader.vue'
    import web from "../web.js";

        //const { getNode, onNodeClick, onNodeDoubleClick, onNodeDragStop} = useVueFlow()
    const flow = useVueFlow({
        defaultZoom: 0.2,
        maxZoom: 3,
        minZoom: 0.1,
    })

//     const nodeTypes = {
//   custom: markRaw(ProcessingNode),
// }

    var state = reactive({
        services: [],
        nodes: [  
            { id: 'md_api', type:'json', label: 'MessyDesk API', position: { x: 200, y: -250 },  data: {description:'Node application',label:'MessyDesk API'}, class: 'light' },

            { id: 'md_ui',  type:'processing', label: 'MessyDesk UI', position: { x: -250, y: -350 }, data: {info:'Vuetify + Vueflow',label:'MessyDesk UI'}, class: 'light' },

            { id: 'db', type: 'json', label: 'ArcadeDB', position: { x: 700, y: 0 }, data: {description:'Graph database',label:'ArcadeDB'}, class: 'light' },

            { id: 'nats', type:'json', label: 'NATS Jetstream', position: { x: 700, y: 350 },  data: {description:'Message stream',label:'NATS Jetstream'}, class: 'light' },

            { id: 'nomad', type:'json', label: 'Nomad', position: { x: -300, y: 350 }, data: {description:'Container orchestration',label:'Nomad'}, class: 'light' },

            { id: 'consumers',  label: 'Nomad', position: { x: 600, y: 350 }, data: {description:'Views (or filters) to message stream',label:'NATS Consumers'}, class: 'light' },

            { id: 'consumer_apps', type:'pdf', label: 'Nomad', position: { x: 200, y: 350 }, data: {description:'One for every service. The compability layer.',label:'Consumer Apps'}, class: 'light' },
        ],

        edges: [
        { id: 'md', source: 'md_ui', target: 'md_api', animated: true, label: 'uses API' },
        { id: 'ws', source: 'md_api', target: 'md_ui', animated: true, label: 'updates UI via ws' },
        { id: 'db', source: 'md_api', target: 'db', sourceHandle: 's_r',  animated: true, label: 'stores graph' },
        { id: 'nomad_md', source: 'md_api', target: 'nomad', animated: true, label: 'controls Nomad' },
        { id: 'nats_md', source: 'md_api', target: 'nats', animated: true, label: 'sends messages' },
        { id: 'nomad_consumers', source: 'consumer_apps', target: 'nomad', animated: true, label: 'sends request to jobs',  targetHandle: 'r', sourceHandle:'l' },
        { id: 'consumers_md', source: 'consumer_apps', target: 'md_api', targetHandle: 't_b', sourceHandle:'t', animated: true, label: 'sends responses to API' },
        { id: 'consumers_apps', source: 'consumers', target: 'consumer_apps', targetHandle: 'r', animated: true, label: 'listens messages' }
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
            console.log(response[s].tasks)
            for(var mediatype of response[s]['supported_types']) {
                data[mediatype].push(response[s])
               // state.nodes.push({id: response[s].id, label: response[s].id, position: { x: 0, y: count * 50 }, parentNode: mediatype, class: 'light', expandParent: true})
                count++
            }
        }
        const positions = {'pdf': {x:-600, y:0}, 'image': {x:0, y:0}, 'text': {x:600, y:0}}
        for(var mediatype in data) {
            var count = 1
            for(var item in data[mediatype]) {

                state.nodes.push({
                    id: data[mediatype][item].id + count, 
                    label: data[mediatype][item].id, 
                    position: { x: positions[mediatype].x, y: count * 350 +400 }, 
                    class: 'light', 
                    type: mediatype, 
                    data: {
                        label: data[mediatype][item].supported_types + ': ' + data[mediatype][item].name,
                        description: data[mediatype][item].description}
                })
                state.edges.push({id: data[mediatype][item].id + Math.random(), target: data[mediatype][item].id + count, source: 'nomad', animated: true, label: 'nomad job'})
                var tasks = 1
                for(var task in data[mediatype][item].tasks) {
                    console.log(task)
                    state.nodes.push({
                        id: data[mediatype][item].id + '_' + task, 
                        label: 'uses ' + task, 
                        position: { x: 250, y: tasks * 30 }, 
                        data: {description: task,label:task}, 
                        class: 'light',
                        parentNode: data[mediatype][item].id + count
                    })
                    tasks++
                }
                count++
            }

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
                        <template #node-image="{ data }">
                            <ImageNode :data="data" />
                        </template>
                        <template #node-text="{ data }">
                            <TextNode :data="data" />
                        </template>
                        <template #node-pdf="{ data }">
                            <PDFNode :data="data" />
                        </template>
                        <template #node-json="{ data }">
                            <JSONNode :data="data" />
                        </template>
                        </VueFlow>


 
                </div>
            </div>
        </div>
    </div>
</template>
