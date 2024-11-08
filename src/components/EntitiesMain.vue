<style scoped>
em {
  font-style: normal;
  font-weight: bold;
  color: red important;  }

  .column_text2 {
  height: 100%;
  overflow-y: scroll;
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
      var response = await web.createEntity(state.current_type, {label: state.new_label})
    }

    onMounted(async()=> {
      state.types = await web.getEntityTypes()
    })



</script>



<template>
    <v-card class="mx-auto fill-height" color="grey-lighten-3" flat>
      <v-layout class="fill-height">

        <JYUHeader/>
  
        <v-main class="fill-height">
          <v-container class="fill-height pa-0" fluid>
            <v-row class="fill-height no-gutters" >
              

           

              <v-col
                class="d-flex fill-height overflow-y-auto"
                cols="12"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                 <v-container>
                  <h2>Entities</h2>
                  <span class="m-2 p-2 cursor-pointer" @click="search(type.type)" v-for="type of state.types.result"> {{ type.type }} ({{ type.count }}) </span>

                  <br>
                  <v-btn v-if="!state.add && state.current_type" class="btn-primary" @click="state.add  = true">Add new</v-btn>

                  <div v-if="state.add">  
                    <v-card title="Add new Entity">
                    <v-card-text>
                      <v-text-field v-model="state.new_label" label="Label"></v-text-field>
                      <v-btn @click="create()">Create</v-btn>

                    </v-card-text>

                    </v-card>

                  </div>

                  
                  <template v-if="state.result && !state.add">

                    <v-card v-for="item in state.result" :key="item" class="mt-2">
                      
                      <v-card-title >
                        <div @click="go(item.id)">  {{item.label}} {{item.lastname}}</div>
                      </v-card-title>
                      <v-card-subtitle>{{ item.type}}</v-card-subtitle> 
                    </v-card>

                  </template>
                  </v-container>
                </v-col>


            </v-row>
          </v-container>
        </v-main>
      </v-layout>
    </v-card>
  </template>


