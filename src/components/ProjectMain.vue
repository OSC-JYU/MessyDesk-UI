<style scoped>
    .thumb {
        height: 120px;
        padding:10px
    }
</style>

<script setup>

    import { onMounted, watch, reactive, ref, nextTick } from "vue";
     import { useRouter, useRoute } from 'vue-router'
    import web from "../web.js";

    import JYUHeader from './JYUHeader.vue'
    import GraphDisplay from './GraphDisplay.vue'
    import NodeCreator from './NodeCreator.vue'

    const route  = useRoute();
    const router = useRouter();

    var state = reactive({projects:[]})


    document.title = "MessyDesk - projects"


    async function loadProjects() {
        state.projects = await web.getProjects()
        // convert projects to graph format
        // for(var node of graph.result.data.nodes) {
        //     node.data = {id:node['@rid']}
        //     node.data.name = node.label
        //     node.data.type = node['@type']
        //     node.data.description = node.file_count + ' files'
        //     node.data.paths = node.paths
        // }
        
    }

    async function loadProject(project) {
        console.log(project)
        router.push({ name: 'graph', query: { node: project['@rid'].replace('#', '')} })
    }

    onMounted(async()=> {
		loadProjects()
	})
</script>


<template>
    <v-card class="mx-auto" color="grey-lighten-3" m>
      <v-layout>
        <v-app-bar
          color="#6B7F97"
          image="https://picsum.photos/1920/1080?random"
         
        >
          <template v-slot:image>
            <v-img
              
            ></v-img>
          </template>
  
          <template v-slot:prepend>
            <v-app-bar-nav-icon></v-app-bar-nav-icon>
          </template>
  
          <v-app-bar-title>MessyDesk - JYU</v-app-bar-title>Projects
  
          <v-spacer></v-spacer>
  

  
          <v-btn icon>
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </v-app-bar>
  
        <v-main color="#EDE1CE">
      
          <v-container fluid>
            <v-row  dense>
              <v-col  cols="6">
                <v-card v-for="project in state.projects" :key="project.id"
                  :subtitle="`files:  ${project.file_count}`"
                  :title="`${project.label}`"
                  :text="project.info"
                  @click="loadProject(project)"
                  >
                  <v-row>
                    <v-col cols="4">

                    </v-col>
                    <v-col cols="8">
                        <template v-for="image in project.paths" :key="image">
                      <img class="thumb" :src="image" /> 
                  </template>
                    </v-col>
                  </v-row>

                </v-card>
              </v-col>

              <v-col cols="6">
                node
              </v-col>

            </v-row>
          </v-container>
        </v-main>
      </v-layout>
    </v-card>
  </template>
  
