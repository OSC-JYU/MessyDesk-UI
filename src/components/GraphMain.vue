
<script setup>
    import { useRoute } from 'vue-router'
    import JYUHeader from './JYUHeader.vue'
    import GraphDisplay from './GraphDisplay.vue'
    import NodeCreator from './NodeCreator.vue'
    import NodeDeleter from './NodeDeleter.vue'
    import web from "../web.js"
    import {store} from "./Store.js"

    document.title = "MessyDesk"

    const route  = useRoute();


    async function createConnectionFromNew(new_node, relation) {

        if(relation.reverse)
            await web.connect(new_node, relation.type, route.query.node)
        else
            await web.connect(route.query.node, relation.type, new_node)

        store.reload()
    }
</script>



<template>
    <div class="vh-100 container-fluid m-0 p-0">
        <div class="row  h-100  w-100 m-0 p-0">
            <div class="col-12 m-0 p-0">
                <div class="h-100 d-flex flex-column w-100 m-0 p-0">
                    <div class="row justify-content-center m-0 p-0">
                        <JYUHeader/>
                    </div>
                    <div class="row m-0 p-0  flex-grow-1">
                        <GraphDisplay mode="graph"/>
                        <NodeCreator mode="graph" @createConnection="createConnectionFromNew"/>
                        <NodeDeleter mode="graph" />
                    </div>
                </div>
            </div>
        </div>



    </div>
</template>
