
<style>
//This changes the width for all the offcanvas in the app
.offcanvas{
     height:50% !important;
} 
</style>

<script setup>
    import { reactive } from "vue";
    import { useRoute } from 'vue-router'
    import {store} from "./Store.js";
    import GraphDisplay from './GraphDisplay.vue'
    import NodeDeleter from './NodeDeleter.vue'
    import Uploader from './Uploader.vue'
    import NodeCard from './NodeCard.vue'
    import JYUHeader from './JYUHeader.vue'
    import CruncherList from './CruncherList.vue'
    import ProcessCreator from './ProcessCreator.vue'
    import SetCreator from './SetCreator.vue'

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

        <JYUHeader mode="graph" @fit-to-node="fitToNode"/>
        
  
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
                <SetCreator mode="graph" />
              </v-col>

              <v-col
                class="d-flex fill-height "
                cols="3"
                color="light-blue lighten-1"
              >
                <!-- Third column content -->
                <NodeCard class="h-100 w-100 position-absolute"/>
              </v-col>
            </v-row>

            <v-dialog v-model="store.crunchers_open" width="auto" min-width="800">

                <v-card>
                    <v-toolbar>
                    <v-btn
                        icon="mdi-close"
                        @click="store.crunchers_open = false"
                    ></v-btn>
                    <v-toolbar-title>Available crunchers for {{ store.current_node.type }}</v-toolbar-title>


                    <v-spacer></v-spacer>


                    </v-toolbar>

                    <CruncherList />
                </v-card>
                
            </v-dialog>

            <ProcessCreator />

          </v-container>
        </v-main>
      </v-layout>
    </v-card>
  </template>
  