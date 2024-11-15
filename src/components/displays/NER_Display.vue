<style >

.column_text {
    height: 90%;
    
  }

.column_text2 {
  height: 100%;
  overflow-y: scroll;
}
.paper {
  border: 1px solid black;
  background-color: white;
}

.highlight {
  background-color: yellow
}
</style>

<template>

    <v-container>
      <v-row>
        <v-btn @click="$emit('change-tab',0)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>Text</h2></div>
      </v-row>
      
      <v-row class="column_text">

        <v-col cols="9" class="column_text2 paper">
          <div v-html="state.source_text"></div>
        </v-col>

        <v-col cols="3" class="column_text2">
          <div v-for="e of entity_order">
            <template v-if="state.entities[e] && state.entities[e].length">
              <h4>{{ e }} <span> {{ state.entities[e].length }}</span></h4>
              <div v-for="entity of state.entities[e]">
                <a :href="'#highlight-'+entity.start">{{ entity.word }}</a> 
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
    import {store} from "../../components/Store.js";

    const route = useRoute();
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])

    const entity_order = ['PERSON', 'GPE', 'DATE', 'ORG', 'LOC', 'EVENT', 'PRODUCT', 'NORP', 'FIBC', 'JON']

    var state = reactive({
        file: null,
        data: null,
        entities: {},
        source: null,
        source_text: ''
    })

        // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      await load()
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
        result += `<span class="highlight" id="highlight-${highlight.start}">${highlightedText}</span>`;
        lastIndex = highlight.end

    });

    result += str.substring(lastIndex);
    // Append any remaining part of the string after the last highlight
    result = result.replace(/\n/g, '<br>');

    return result;
}

    async function load() { 
      var response = await web.getDocInfo(store.file['@rid'])
        state.source = await web.getDocInfo(store.source)
        
        state.file = response
        state.data = await web.getFiles(state.file['@rid'].replace('#', ''))
        var source_text = await web.getFiles(state.source['@rid'].replace('#', ''))
        state.json = state.data
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
    }

    onMounted(async()=> {
      await load()
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