
<style>
//This changes the width for all the offcanvas in the app
.offcanvas{
     height:50% !important;
} 
</style>

<script setup>
    import { reactive } from "vue";
    import { useRoute } from 'vue-router'
    import GraphDisplay from './GraphDisplay.vue'
    import NodeDeleter from './NodeDeleter.vue'
    import Uploader from './Uploader.vue'
    import NodeCard from './NodeCard.vue'
    import JYUHeader from './JYUHeader.vue'

    document.title = "MessyDesk"

    const route  = useRoute();

    var state = reactive({node:''})

    function fitToNode(id) {
        state.node = id + '-' + Math.random()
    }


</script>


<template>
    <v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
      <v-layout class="fill-height">

        <JYUHeader @fit-to-node="fitToNode"/>
        
  
        <v-main class="fill-height">
          <v-container class="fill-height pa-0" fluid>
            <v-row class="fill-height no-gutters" >


              <v-col
                class="d-flex fill-height "
                cols="9"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                <GraphDisplay mode="graph"  :fit="state.node"  />
                <Uploader mode="graph" />
                <NodeDeleter mode="graph" />
              </v-col>

              <v-col
                class="d-flex fill-height "
                cols="3"
                color="light-blue lighten-1"
              >
                <!-- Third column content -->
                <NodeCard class="h-100 w-100 position-absolute"/>
               <!--  <NodeCard  @updateGraph="updateGraphNode" class="h-100 w-100 position-absolute"/> -->
            
              </v-col>
            </v-row>
          </v-container>
        </v-main>
      </v-layout>
    </v-card>
  </template>
  