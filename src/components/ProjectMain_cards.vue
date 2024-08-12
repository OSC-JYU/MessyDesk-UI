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
    <v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
      <v-layout class="fill-height">

        <JYUHeader @fit-to-node="fitToNode"/>
        
  
        <v-main >
          <v-container  >
            <v-row >


              <v-col
   class="overflow-auto"
                cols="9"
                color="light-blue lighten-3"
              >
                <!-- Left column content -->
               <v-flex>
                <v-card v-for="project in state.projects" :key="project.id"
                  :subtitle="`files:  ${project.file_count}`"
                  :title="`${project.label}`"
                  :text="project.info"
                  @click="loadProject(project)"
                  class="ma-2 pa-2"
                  >
 
                        <template v-for="image in project.paths" :key="image">
                      <img class="thumb" :src="image" /> 
                  </template>

                </v-card>
            </v-flex>
              </v-col>

              <v-col
                class="d-flex fill-height "
                cols="3"
                color="light-blue lighten-1"
              >
                <!-- right column content -->
                <ProjectCard class="h-100 w-100 position-absolute"/>

            dfg
              </v-col>
            </v-row>
          </v-container>
        </v-main>
      </v-layout>
    </v-card>
  </template>


