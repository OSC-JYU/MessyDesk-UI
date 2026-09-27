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
        tags: [],
        machine_tags: [],
        machine_tag_files: null,
        active_machine_tag: null,
        ner_regions: null,
        add: false
    })

    async function search(type) {
      state.current_type = type
      var response = await web.getTags(type)
      state.result = response.result
    }

    async function create() {
      var response = await web.createTag(state.new_label, state.new_description)
      state.add = false
      state.new_label = ''
      state.new_description = ''
      state.tags = await web.getTags()
    }

    async function browseMachineTag(tag) {
      state.active_machine_tag = tag
      state.ner_regions = null
      var response = await web.getMachineTagFiles(tag.entity_rid, tag.service_id, tag.task)
      state.machine_tag_files = response
    }

    // ner.json already holds every mention (start/end/confidence) for a label; TagLink only
    // stores one row per (file, label), so region-level detail is read from ner.json on demand.
    async function showRegionsForFile(file) {
      const runs = await web.getNerRegions(file['@rid'])
      const label = state.active_machine_tag?.label
      state.ner_regions = (runs || [])
        .flatMap((run) => Object.values(run.rois || {}))
        .filter((region) => region.label === label)
    }

    onMounted(async()=> {
      state.tags = await web.getTags()
      state.machine_tags = await web.getMachineTags()
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
            <v-container>
              <v-row>
                <v-btn @click="$router.go(-1)"><v-icon>mdi-arrow-left</v-icon></v-btn>
              </v-row>
              <v-row class="mt-6">
                <div v-if="state.file"><h2><router-link :to="'/files/' + state.file['@rid'].replace('#','')">{{ state.file.label }}</router-link></h2></div>
              </v-row>
              <v-row class="column_text">

                <v-col cols="8" class="column_text2 ">
                  
                  <div ref="textContainer" v-html="state.text"></div>
                  <v-card color="#EDE1CE" class="pa-6">TIP: Tags are freely defined words, that you can attach to documents.</v-card>

                </v-col>

                <v-col
                class="d-flex fill-height overflow-y-auto"
                cols="4"
                color="light-blue lighten-3"
              >
                <!-- Second column content -->
                <v-container>
              
           
                  <h2>Tags</h2>    

                  <br>
                  <v-btn v-if="!state.add" class="btn-primary" @click="state.add  = true">Add new</v-btn> 

                  <div v-if="state.add">  
                    <v-card title="Add new Tag">
                    <v-card-text>
                      <v-text-field v-model="state.new_label" label="Label"></v-text-field>
                      <v-text-field v-model="state.new_description" label="Description (optional)"></v-text-field>
                      <v-btn @click="create()">Create</v-btn>
                    </v-card-text>
                    </v-card>
                  </div>
                <v-container>

                  <v-badge
                  color="black"
                  :content="tag.label"
                  inline
                  v-for="tag in state.tags.result"
                >{{tag.label}}</v-badge>

                </v-container>

                  <h2 class="mt-6">Machine tags</h2>
                  <v-container>
                    <v-card v-for="tag in state.machine_tags" :key="tag.service_id + tag.task + tag.entity_rid" class="mt-2" @click="browseMachineTag(tag)">
                      <v-card-title>{{ tag.label }} <v-chip size="small" class="ml-2">{{ tag.count }}</v-chip></v-card-title>
                      <v-card-subtitle>{{ tag.service_id }}:{{ tag.task }}</v-card-subtitle>
                    </v-card>
                  </v-container>

                  <template v-if="state.machine_tag_files">
                    <h3>Files tagged "{{ state.active_machine_tag?.label }}"</h3>
                    <v-card v-for="file in state.machine_tag_files" :key="file.rid" class="mt-2" @click="showRegionsForFile(file)">
                      <v-card-title>{{ file.label }}</v-card-title>
                      <v-card-subtitle v-if="file.confidence != null">confidence: {{ file.confidence }}</v-card-subtitle>
                    </v-card>
                  </template>

                  <template v-if="state.ner_regions">
                    <h3>Regions</h3>
                    <v-card v-for="region in state.ner_regions" :key="region.id" class="mt-2">
                      <v-card-text>"{{ region.text }}" ({{ region.start }}-{{ region.end }}), confidence: {{ region.confidence }}</v-card-text>
                    </v-card>
                  </template>


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
            </v-col>

          </v-row>
        </v-container>
      </v-main>
    </v-layout>
  </v-card>  


 
  </template>


