<style >

.column_text {
    height: 90%;
    overflow-y: scroll;
  }

.highlight {
  background-color: yellow
}
</style>

<template>

    <v-container>
      <v-row>
        <v-btn @click="$router.go(-1)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>Text</h2></div>
      </v-row>
      <v-row class="column_text">

        <v-col cols="9" >
          <div v-html="state.source_text"></div>
        </v-col>

        <v-col cols="3">
          <div v-for="e of entity_order">
            <template v-if="state.entities[e] && state.entities[e].length">
              <h4>{{ e }} <span> {{ state.entities[e].length }}</span></h4>
              <div v-for="entity of state.entities[e]">
                {{ entity.word }}
              </div>
            </template>
          </div>
        </v-col>  

      </v-row>
    </v-container>



  </template>
  
  <script setup>

    import { onMounted, watch, reactive, ref, computed } from "vue";
    import { useRouter, useRoute } from 'vue-router'
  
    import web from "../../web.js";

    const route = useRoute();

    const entity_order = ['PERSON', 'GPE', 'DATE', 'ORG', 'LOC', 'EVENT', 'PRODUCT', 'NORP', 'FIBC', 'JON']

    var state = reactive({
        file: null,
        data: null,
        entities: {},
        source: null,
        source_text: ''
    })

    function renderStringAsHtml(str, highlights) {
    let result = '';
    let lastIndex = 0;
    let offset = 0;

    highlights.forEach((highlight) => {
        // Adjust start and end positions by the current offset
        let start = highlight.start;
        let end = highlight.end;

        // Append the part of the string before the highlight
        result += str.substring(lastIndex, start);
        
        // Append the highlighted part with line breaks handled
        const highlightedText = str.substring(highlight.start, highlight.end);
        result += `<span class="highlight">${highlightedText}</span>`;
        lastIndex = highlight.end

    });

    result += str.substring(lastIndex);
    // Append any remaining part of the string after the last highlight
    result = result.replace(/\n/g, '<br>');

    return result;
}



    onMounted(async()=> {

        var response = await web.getDocInfo(route.params.rid)
        state.source = await web.getDocInfo(route.query.source)
        
        state.file = response
        state.data = await web.getFiles(route.params.rid)
        var source_text = await web.getFiles(state.source['@rid'].replace('#', ''))
        state.json = JSON.parse(state.data.replace(/'/g, '"'))
        if(Array.isArray(state.json)) {
          
          for(var entity of state.json) {
            console.log(entity['entity_group'])
            if(state.entities[entity['entity_group']]) {
              state.entities[entity['entity_group']].push(entity)
            } else {
              state.entities[entity['entity_group']] = [entity]
            }
          }
        }
        console.log(state.json)
        state.source_text = renderStringAsHtml(source_text, state.json)
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