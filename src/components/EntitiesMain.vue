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

.set-panel2 {
       
        margin-top:20px;
      
    }

</style>

<script setup>
    import JYUHeader from './JYUHeader.vue'
    import web from "../web.js";
    
    import { onMounted, reactive} from "vue";
    import { useRoute } from 'vue-router'

    import SetViewNode from './nodes/SetViewNode.vue'
    import {store} from "./Store.js";
    import { en } from 'vuetify/locale';

    const route = useRoute();
    const emit = defineEmits(['open-node'])

    document.title = "MessyDesk - browse"


    var state = reactive({
        search: "",
        new_label: "",
        result: [],
        items: [],
        types: [],
        add: false,
        current_type: '',
        current_entity: {},
        types: [],
        entity_schema: [],
        selected_entities: []
    })

    
    async function selectEntity(entity) {
      state.selected_entities.push(entity)
      var response = await web.getEntityItems(state.selected_entities)
      console.log(state.selected_entities)
      state.items = response
    }

    async function unselect(entity) {
      state.selected_entities = state.selected_entities.filter(e => e['@rid'] != entity['@rid'])
      var response = await web.getEntityItems(state.selected_entities)
      state.items = response
    }

    async function create() {
      var response = await web.createEntity(state.current_type, state.new_label)
      state.add = false
      state.new_label = ''
      state.types = await web.getEntities()
    }

    function openTaggedFile(file, index) {
      store.tag = 2 // come back to this tab when user closes file view
      emit('open-node', file.rid, store.current_node.id, 0, index )
    }

    function entityProps(item) {
      return {
        title: item.type,
        value: item.type
      }
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


              <v-row  class="column_text">

                <!-- Main view -->
                

                <v-col cols="8" class="column_text2 ">

                  <v-row class="set-panel2">
                    <v-chip v-for="entity of state.selected_entities" :key="entity.id"  :color="entity.color" @click="unselect(entity)"><v-icon v-if="entity.icon" :icon="'mdi-' + entity.icon.toLowerCase()" start></v-icon>{{ entity.label }}<v-icon end>mdi-close</v-icon></v-chip>
                  </v-row>
                  
                 
                  
                  <v-card v-if="state.items.length == 0" color="rgb(186, 219, 204)" class="pa-6"> <h4>What are Tags?</h4><p>Tags are tools to help you organise your data. Tags can be persons, places, events, generic tags or any other thing you want to call a Tag.</p>
                    <!-- <p>The idea is that you can link Things to your findings in data. For example, if you used <b>Natural Entity Recognition</b> to extract persons from your files, then you can link them to your Person things. This allows you to separate AI-findings from you own interpretations.</p><p>And finally, Things can have metadata and relations to other things. When we sum all this up, you get a directed graph.</p> -->
                    <p class="alert alert-info">Tags are under development.</p> 
                  </v-card>

                  <v-row class="set-panel2">
                            <v-col
                            v-for="(file, index) in state.items"
                            :key="file.rid"
                            class="d-flex child-flex flow"
                            cols="2"
                            >                 

                            <!-- SET VIEW NODE-->
                            <SetViewNode @dblclick="openTaggedFile(file, index)" :data="file"></SetViewNode>

                            </v-col>
                        </v-row>

                </v-col>


                <!-- Second column content -->
                <v-col
                class="d-flex fill-height overflow-y-auto"
                cols="4"
                color="light-blue lighten-3"
              >
                <v-container>
            

                  <v-expansion-panels >
                    <v-expansion-panel v-for="type in state.types" :key="type.type">
                      <v-expansion-panel-title>{{ type.type }}</v-expansion-panel-title>
                      <v-expansion-panel-text >
                        <v-chip @click="selectEntity(item)" v-for="item in type.items" :key="item['@rid']" :color="item.color" ><v-icon :icon="'mdi-' + item.icon.toLowerCase()" start></v-icon> {{ item.label }}</v-chip>
                      </v-expansion-panel-text> 
                    </v-expansion-panel>
                  </v-expansion-panels>


                  <v-btn v-if="!state.add" class="btn-primary mt-4" @click="state.add  = true" color="primary" >Add new</v-btn>

                  <div v-if="state.add" class="mt-4">  
                    <v-card title="Add new Tag">
                      <v-card-text>
                        <v-select :items="state.entity_schema" v-model="state.current_type" label="Tag Type" :item-props="entityProps"></v-select>

                        <v-text-field v-model="state.new_label" label="Tag Label"></v-text-field>

                      </v-card-text>
                      <v-card-actions>
                        <v-btn @click="create()" color="primary" v-if="state.current_type" >Create</v-btn>
                        <v-btn @click="state.add = false">Cancel</v-btn>
                      </v-card-actions>
                     
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


