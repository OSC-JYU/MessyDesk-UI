<style scoped>
em {
  font-style: normal;
  font-weight: bold;
  color: red important;  }

  .column_text2 {
  height: 100%;
  overflow-y: scroll;
}
.v-chip {
  margin: 2px;
}

</style>

<script setup>
    import JYUHeader from './JYUHeader.vue'
    import web from "../web.js";
    
    import { onMounted, reactive} from "vue";
    import { useRoute } from 'vue-router'

    const route = useRoute();

    document.title = "MessyDesk - search"


    var state = reactive({
        search: "",
        result: [],
        types: [],
        add: false,
        current_type: ''
    })

    
    async function search(type) {
      state.current_type = type
      var response = await web.getEntitiesByType(type)
      state.result = response.result
    }

    async function create() {
      var response = await web.createEntity(state.current_type, state.new_label)
      state.add = false
    }

    onMounted(async()=> {
      state.types = await web.getEntities()
      state.entity_schema = await web.getEntitySchema()
    })



</script>



<template>

<v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
    <v-layout class="fill-height">

      <v-main class="fill-height">
        <v-container class="fill-height pa-0" fluid>
          <v-row class="fill-height no-gutters" >

         

            <v-col
              class="d-flex fill-height overflow-aut"
              cols="12"
              color="light-blue lighten-3"
            >
            <v-container>

              <v-row class="mt-6">
                <div v-if="state.file"><h2><router-link :to="'/files/' + state.file['@rid'].replace('#','')">{{ state.file.label }}</router-link></h2></div>
              </v-row>
              <v-row class="column_text">

                <v-col cols="8" class="column_text2 ">
                  
                  <v-card color="#EDE1CE" class="pa-6"> <h4>What are things?</h4><p>Things are entities that YOU (not machine) have created. Things can be persons, places, events, tags or any other thing you want to call a Thing.</p><p>The idea is that you can link Things to your findings in data. For example, if you used <b>Natural Entity Recognition</b> to extract persons from your files, then you can link them to your Person things. This allows you to separate AI-findings from you own interpretations.</p><p>And finally, Things can have metadata and relations to other things. When we sum all this up, you get a directed graph.</p><p class="alert alert-info">Things are not implemented yet.</p> </v-card>
                </v-col>

                <v-col
                class="d-flex fill-height overflow-y-auto"
                cols="4"
                color="light-blue lighten-3"
              >

                <!-- Second column content -->
                 
                <v-container>
              
           
                  
                  <span class="m-2 p-2 cursor-pointer" @click="search(type.type)" v-for="type of state.types"> {{ type.type }} ({{ type.count }}) </span>

                  <br>

                  
                  <v-container v-if="state.result && !state.add">

                    <v-template v-for="item in state.result" :key="item" class="mt-2">
                      
                     
                        <v-chip class="ma-2" :color="item.color" label> <v-icon :icon="'mdi-' + item.icon.toLowerCase()" start></v-icon>  {{item.label}} </v-chip>
       
                    </v-template>

                  </v-container>


                  <v-expansion-panels >
                    <v-expansion-panel v-for="type in state.types" :key="type.type">
                      <v-expansion-panel-title>{{ type.type }}</v-expansion-panel-title>
                      <v-expansion-panel-text >
                        <v-chip v-for="item in type.items" :key="item['@rid']" :color="item.color" ><v-icon :icon="'mdi-' + item.icon.toLowerCase()" start></v-icon> {{ item.label }}</v-chip>
                      </v-expansion-panel-text> 
                    </v-expansion-panel>
                  </v-expansion-panels>

                  <v-btn v-if="!state.add && state.current_type" class="btn-primary" @click="state.add  = true">Add new</v-btn>



                  <div v-if="state.add">  
                    <v-card title="Add new Entity">
                      <v-card-text>
                        <v-text-field v-model="state.new_label" label="Label"></v-text-field>
                        <v-btn @click="create()">Create</v-btn>
                      </v-card-text>
                    </v-card>
                  </div>
                  </v-container>
                </v-col>

              </v-row>
            </v-container>
            </v-col>

          </v-row>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>  


 
  </template>


