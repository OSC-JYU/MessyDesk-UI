<script setup>
    import { reactive } from "vue";
    import {store} from "./Store.js";
    import web from "../web.js";
    import JYUHeader from './JYUHeader.vue'
    import GraphDisplay from './GraphDisplay.vue'
    import ProjectCard from './ProjectCard.vue'


    document.title = "MessyDesk - projects"

    var state = reactive({node:'', dialog: false, project_name:''})

    function fitToNode(id) {
        state.node = id + '-' + Math.random() // add random so that we trigger watch event even if we click same node again
    }

    function openProjectDialog() {

        state.dialog = true
    }

    async function createProject() {
        if(state.project_name == '') {
            state.error = 'Give project name!'
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
                class="d-flex fill-height "
                cols="9"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                <GraphDisplay mode="projects"   :fit="state.node"  />

              </v-col>

              <v-col
                class="d-flex fill-height "
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
        title="Create new project"
      >
      <v-card-text>

        <v-col>
            <v-text-field v-model="state.project_name"
                label="Project name*"
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