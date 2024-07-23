<template>
    <div class="container">
      <div class="col-9 m-2">
        <div v-for="e of entity_order">
          <h4>{{ e }} <span v-if="state.entities[e]"> {{ state.entities[e].length }}</span><span v-else>0</span></h4>
          <div v-for="entity of state.entities[e]">
            {{ entity.word }}
          </div>
        </div>

      </div>
      <div class="col-3">
        <template v-if="state.file">
            <div class="card m-2">
                <div class="card-header"><h2>{{ state.file.label }}</h2></div>
                <p>{{ state.file.path }}</p>
            </div>

        </template>
      </div>
    </div>
  </template>
  
  <script setup>

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
  
    import web from "../../web.js";

    const route = useRoute();

    const entity_order = ['PERSON', 'GPE', 'DATE', 'ORG']

    var state = reactive({
        file: null,
        data: null,
        entities: {}
    })

    onMounted(async()=> {

        var response = await web.getDocInfo(route.params.rid)
        
        state.file = response
        state.data = await web.getFiles(route.params.rid)
        state.json = JSON.parse(state.data.replace(/'/g, '"'))
        for(var entity of state.json) {
          console.log(entity['entity_group'])
          if(state.entities[entity['entity_group']]) {
            state.entities[entity['entity_group']].push(entity)
          } else {
            state.entities[entity['entity_group']] = [entity]
          }
        }
    })



  </script>
  
  <style scoped>
  .container {
    display: flex;
  }
  
  .column {
    flex: 1;
  }
  
  .column img {
    max-width: 100%;
    height: auto;
  }
  </style>