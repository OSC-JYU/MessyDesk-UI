<script setup>
    import JYUHeader from './JYUHeader.vue'
    import GraphDisplay from './GraphDisplay.vue'
    import NodeCreator from './NodeCreator.vue'


    document.title = "MessyDesk - projects"
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
                        <GraphDisplay mode="projects"/>
                        <NodeCreator mode="list"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
