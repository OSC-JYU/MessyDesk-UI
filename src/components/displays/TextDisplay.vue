<template>
    <v-container>
      <v-row>
        <v-btn @click="$emit('change-tab',0)"><v-icon>mdi-arrow-left</v-icon></v-btn>
      </v-row>
      <v-row class="mt-6">
        <div v-if="state.file"><h2>{{ state.file.label }}</h2></div>
      </v-row>
      <v-row class="column_text">

        <v-col cols="9" class="column_text2 paper">
          <div ref="textContainer" v-html="state.text"></div>
        </v-col>

        <v-col cols="3" class="column_text2">
          <template >
            <v-card>
                 <v-card-title>Saved selections (text ROIs)</v-card-title>
                <v-card-text>
                  <v-alert>not implemented yet</v-alert>
                  <v-btn @click="getSelectedText">Get Selected Text</v-btn>
                  {{ state.selectedText }} {{ state.selectionStart }} {{ state.selectionEnd }}
                </v-card-text> 
                
            </v-card>
          </template>
        </v-col>  

      </v-row>
    </v-container>

    
  </template>
  
  <script setup>

    import { onMounted, reactive, ref, watch } from "vue";
  
    import web from "../../web.js";
    import {store} from "../../components/Store.js";

    const textContainer = ref(null)

    // tab controls
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])
    // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      await load()
    })

    var state = reactive({
        file: null,
        cruncher: null,
        selectedText: '',
        selectionStart: -1,
        selectionEnd: -1,
        text: ''
    })

    function getSelectedText() {
  
      const selection = window.getSelection();
      //var selectedText = window.getSelection().toString();
      //console.log(selectedText)
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);

       // Ensure the selection is within the text container
       if (textContainer.value.contains(range.commonAncestorContainer)) {
          state.selectedText = selection.toString();

          // Use Range to calculate the start and end positions
          const preSelectionRange = range.cloneRange();
          preSelectionRange.selectNodeContents(textContainer.value);
          preSelectionRange.setEnd(range.startContainer, range.startOffset);

          // Calculate the character offset by measuring the length of the pre-selection range
          state.selectionStart = preSelectionRange.toString().length;
          state.selectionEnd = state.selectionStart + state.selectedText.length;
        } else {
          // Clear values if selection is outside the container
          state.selectedText = '';
          state.selectionStart = -1;
          state.selectionEnd = -1;
        }

      }
    }

    function replaceWithBr(text) {
      return text.replace(/\n/g, "<br />")
    }

    async function load() {
        var f = await web.getNodeFile(store.file['@rid'])
        state.text = replaceWithBr(f)
    }

    onMounted(async()=> {

        load()

    })

    function removeLastPathPart(str) {
        const lastIndex = str.lastIndexOf('/');
        if (lastIndex !== -1) {
            return str.substring(0, lastIndex);
        }
        return str;
    }

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
  </style>