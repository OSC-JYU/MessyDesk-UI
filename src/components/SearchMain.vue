<style scoped>
em {
  font-style: normal;
  font-weight: bold;
  color: red important;  }

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
        result: []
    })

    async function search() {
        state.result = await web.search(state.search)
    }

    onMounted(async()=> {

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
                class="d-flex fill-height overflow-aut"
                cols="12"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                 <v-container>

                  <v-text-field v-model="state.search" @keydown.enter="search()" label="Search"></v-text-field>
                  <v-btn @click="search()">Search</v-btn>


                  <v-checkbox label="Checkbox"></v-checkbox>
                  <v-select
                    label="Select"
                    :items="[{title:'All', value:'all'}, {title:'Texts', value:'text'}]"
                  ></v-select>

                  
                  <template v-if="state.result.response">
                  <v-card v-for="item in state.result.response.docs" :key="item" class="mt-2">
                    <v-card-title >
                      <div @click="go(item.id)">{{item.node}}  ({{item.type}}) {{item.label}} </div>
                    </v-card-title>
                    <v-card-subtitle v-if="item.description">{{ item.description.replace('\n', '') }}</v-card-subtitle> 
                    <v-card-text v-if="state.result.highlighting[item.id]" v-html="state.result.highlighting[item.id].fulltext"></v-card-text>
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


