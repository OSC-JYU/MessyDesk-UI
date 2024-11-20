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
          <div ref="textContainer" v-html="state.text"></div>
        </v-col>

        <v-col cols="3" class="column_text2">
          <div v-if="state.file">
            <h4>{{ state.file.label}}</h4>
            {{ state.file.description }}
          </div>
          <v-switch color="primary" @change="toggleSearch()" label="Enabled in search"></v-switch>
          <v-card title="Region of Interest">
              <v-alert type="info" class="mt-6">Click and drag to create saved selections (ROI).</v-alert>
              

                  <v-alert type="warning">not implemented for text yet</v-alert>
                  <!-- <v-btn @click="getSelectedText">Create ROI</v-btn>
                  {{ state.selectedText }} {{ state.selectionStart }} {{ state.selectionEnd }} -->
            
                
            </v-card>
          
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

    function toggleSearch(n) {
      console.log(n)
    }

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
      state.file = await web.getDocInfo(store.file['@rid'])
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
.v-container {
  max-width: 1600px;
  margin-left:100px;
}
  </style>