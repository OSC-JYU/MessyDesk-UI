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

.PERSON {
  background-color: rgb(139, 200, 125)
}

.GPE {
  background-color: rgb(199, 173, 114)
}

.DATE {

  background-color: rgb(171, 137, 193)
}

.NORP {
  background-color: rgb(137, 188, 193)
}

.LOC {
  background-color: rgb(187, 193, 137)
}
</style>

<template>

    <v-container>
      <v-btn
        class="ma-2"
        color="primary"
        icon="mdi-close"
        style="position: absolute; top: 0; left: -60px; z-index:1000"
        @click="$emit('change-tab',0)"
      ></v-btn>

      <v-row class="column_text">

        <v-col cols="9" class="column_text2 paper">
          <div v-html="state.source_text"></div>
        </v-col>

        <v-col cols="3" class="column_text2">
          <div v-if="state.file">{{ state.source.label }}</div>
          
          <div v-for="e of entity_order">
            <template v-if="state.entities[e] && state.entities[e].length">
              <h5>{{ e }} <span> {{ state.entities[e].length }}</span></h5>
              <div v-for="entity of state.entities[e]">
                <a :href="'#highlight-'+entity.start" :class="entity.entity_group">{{ entity.word }}</a> 
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

    // tab controls
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])
    // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      await load()
    })

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
      console.log(highlight)
        // Adjust start and end positions by the current offset
        let start = highlight.start;
        let end = highlight.end;

        // Append the part of the string before the highlight
        result += str.substring(lastIndex, start);
        
        // Append the highlighted part with line breaks handled
        const highlightedText = str.substring(highlight.start, highlight.end);
        result += `<span class="highlight ${highlight.entity_group}" id="highlight-${highlight.start}">${highlightedText}</span>`;
        lastIndex = highlight.end

    });

    result += str.substring(lastIndex);
    // Append any remaining part of the string after the last highlight
    result = result.replace(/\n/g, '<br>');

    return result;
}

    async function load() { 
      state.entities = {}
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
  .v-container {
  max-width: 1600px;
  margin-left:100px;
}
  </style>