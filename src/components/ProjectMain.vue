<style scoped>
.full-background {
    background-image:  url('../assets/images/right-column-bg2.png');
    background-size: cover; /* Ensures the image covers the entire div */
    background-repeat: no-repeat; /* Prevents the image from repeating */
    background-position: center; /* Centers the image within the div */
    width: 100%; /* Optional: make the div take up the full width of its container */
    height: 100%; /* Optional: make the div take up the full height of its container */
  
}

</style>



<script setup>
    import { reactive } from "vue";
    import {store} from "./Store.js";
    import web from "../web.js";
    import JYUHeader from './JYUHeader.vue'
    import GraphDisplay from './GraphDisplay.vue'
    import ProjectCard from './ProjectCard.vue'


    document.title = "MessyDesk - desks"

    var state = reactive({node:'', dialog: false, project_name:''})

    function fitToNode(id) {
        state.node = id + '-' + Math.random() // add random so that we trigger watch event even if we click same node again
    }

    function openProjectDialog() {

        state.dialog = true
    }

    async function createProject() {
        if(state.project_name == '') {
            state.error = 'Give desk a name!'
        } else {
            state.error = ''
            await web.createProject(state.project_name)
            state.dialog = false
            var response = await web.getProjects()
            state.items = response
            store.reload()
        }
    }

    function cancel() {
        state.dialog = false
        state.project_name = ''
    }


</script>


<template>
    <v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
      <v-layout class="fill-height">

        <JYUHeader mode="projects"  @fit-to-node="fitToNode" @create-project="openProjectDialog"/>
        
  
        <v-main class="fill-height">
           
          <v-container class="fill-height pa-0" fluid>
            <v-row class="fill-height no-gutters" >


              <v-col
                class="d-flex fill-height pb-0"
                cols="9"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                <GraphDisplay mode="projects"   :fit="state.node"  />

              </v-col>

              <v-col 
                class="pa-0 full-background"
                cols="3"
                color="light-blue lighten-1"
              >
                <!-- Third column content -->
                
                <ProjectCard class="h-100 w-100 position-absolute"/>
            
              </v-col>
            </v-row>
          </v-container>
        </v-main>
      </v-layout>
    </v-card>

    <v-dialog
      v-model="state.dialog"
      width="auto"
    >
      <v-card
        max-width="600"
        prepend-icon="mdi-update"
        title="Create new desk"
      >
      <v-card-text>

        <v-col>
            <v-text-field v-model="state.project_name"
                label="Desk name*"
                required
              ></v-text-field>
        </v-col>
      </v-card-text>
        <template v-slot:actions>
            <v-btn
            class="ms-auto"
            text="Cancel"
            @click="cancel()"
          ></v-btn>
          <v-btn
            class="ms-auto"
            text="Create"
            @click="createProject()"
          ></v-btn>
        </template>
      </v-card>
    </v-dialog>


  </template>