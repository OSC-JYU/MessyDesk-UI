
<style>
//This changes the width for all the offcanvas in the app
.offcanvas{
     height:50% !important;
} 
</style>

<script setup>
    import { useRoute } from 'vue-router'
    import JYUHeader from './JYUHeader.vue'
    import GraphDisplay from './GraphDisplay.vue'
    import ProcessCreator from './ProcessCreator.vue'
    import NodeDeleter from './NodeDeleter.vue'
    import Uploader from './Uploader.vue'

    document.title = "MessyDesk"

    const route  = useRoute();


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
                        <GraphDisplay mode="graph" />
                        <ProcessCreator mode="graph" />
                        <Uploader mode="graph" />
                        <NodeDeleter mode="graph" />
                    </div>
                </div>
            </div>
        </div>




    </div>
</template>
