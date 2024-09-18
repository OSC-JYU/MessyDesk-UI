
<style>


.full-background {
    background-image:  linear-gradient(rgba(19,84,122,.8), rgba(128,208,199,.8)),url('../assets/images/right-column-bg2.png');
    background-size: cover; /* Ensures the image covers the entire div */
    background-repeat: no-repeat; /* Prevents the image from repeating */
    background-position: center; /* Centers the image within the div */
    width: 100%; /* Optional: make the div take up the full width of its container */
    height: 100%; /* Optional: make the div take up the full height of its container */

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
                class="pb-0 fill-height "
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
                class="pa-0 full-background"
                cols="3"
                color="light-blue lighten-1"
              >
                <!-- Third column content -->
                <NodeCard class="h-100 w-100 position-absolute"/>
              </v-col>
            </v-row>

            <v-dialog v-model="store.crunchers_open" width="auto" min-width="900">

                <v-card>
                    <v-toolbar>
                    <v-btn
                        icon="mdi-close"
                        @click="store.crunchers_open = false"
                    ></v-btn>
                    <v-toolbar-title>Available crunchers for {{ store.current_node.type }} {{ store.cruncher_filter }}</v-toolbar-title>


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
  