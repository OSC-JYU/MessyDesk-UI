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


          <template v-if="state.file_count > 0">
            <v-btn @click="prev()" :disabled="state.skip == 1" color="secondary"><v-icon>mdi-chevron-left</v-icon></v-btn>
          {{state.skip }} / {{state.file_count}} 
          <v-btn @click="next()" :disabled="state.skip == state.file_count" color="secondary"><v-icon>mdi-chevron-right</v-icon></v-btn>
          </template>

          <div v-if="state.file">
            <h4>{{ state.file.label}}</h4>
          
            <DescriptionEditor :description="state.file.description" :rid="state.file['@rid']"/>
            <!-- list of entities -->
 
            <v-sheet>
              <v-chip @click="deleteOrOpenEntity($event, entity.rid)" v-for="entity of state.file.entities" :key="entity.type" :color="entity.color" variant="outlined" >
                <v-icon :icon="'mdi-' + entity.icon.toLowerCase()" start></v-icon> {{ entity.label}}
                <v-icon v-if="state.isCtrlPressed" icon="mdi-close-circle" end></v-icon>
                
              </v-chip>
              <p v-if="state.file.entities && state.file.entities.length" class="font-weight-bold">Ctrl + click to remove</p>
             </v-sheet>
          </div>



          <!-- <v-switch color="primary" @change="toggleSearch()" label="Enabled in search"></v-switch> -->


          <v-list v-model:opened="state.open">
        
            <v-list-group value="Tags">
              <template v-slot:activator="{ props }">
                <v-list-item
                  v-bind="props"
          
                  title="Tags"
                ></v-list-item>
              </template>

              <v-list-group v-for="type in state.entities" :key="type.type">
                <template v-slot:activator="{ props }">
                  <v-list-item
                    v-bind="props"
                    :title="type.type"
                    :prepend-icon="'mdi-' + type.icon"
                  ></v-list-item>
                </template>
                <v-chip @click="linkEntityToItem(item['@rid'])" v-for="item in type.items" :key="item['@rid']" :color="item.color" ><v-icon :icon="'mdi-' + item.icon.toLowerCase()" start></v-icon> {{ item.label }}</v-chip>

              </v-list-group>
            </v-list-group>

            <v-list-group value="Selections">
              <template v-slot:activator="{ props }">
                <v-list-item
                  v-bind="props"
                  title="Selections"
                ></v-list-item>
              </template>

              <v-alert type="info" class="mt-6">Click and drag to create saved selections (ROI).</v-alert> 
              <v-alert type="warning">not implemented for text yet</v-alert>
            </v-list-group>
          </v-list>

          <a v-if="state.file" class="text-medium-emphasis" title="open file in browser tab" target="_blank" :href="apiUrl + '/api/files/' + state.file['@rid'].replace('#','')">
              <v-btn  color="primary" class="mt-3">open full file</v-btn>
            </a> 

        </v-col>  
      </v-row>
    </v-container>

    
  </template>
  
  <script setup>

    import { onMounted, onUnmounted, reactive, ref, watch } from "vue";
  
    import web from "../../web.js";
    import {store} from "../../components/Store.js";
    import DescriptionEditor from './DescriptionEditor.vue'
    const apiUrl = import.meta.env.VITE_API_PATH

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
        text: '',
        entities: {},
        open: []
    })

    async function prev() {
      if((state.skip -1) < 1) return
      state.ROIs = []
      state.skip = state.skip - 1
      var response = await web.getSetFiles(store.current_node.id, state.skip - 1, 1)
      state.file = response.files[0]
      var f = await web.getNodeFile(response.files[0]['@rid'])
      state.text = replaceWithBr(f)
    }

    async function next() {
      if((state.skip ) > state.file_count) return
      state.ROIs = []
      state.skip = state.skip + 1
      var response = await web.getSetFiles(store.current_node.id, state.skip -1 , 1)
      state.file = response.files[0]
      var f = await web.getNodeFile(response.files[0]['@rid'])
      state.text = replaceWithBr(f)
    }

    
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



    async function linkEntityToItem(entityID) {
      console.log(entityID)
      console.log(state.file['@rid'])
      await web.linkEntityToItem(entityID, state.file['@rid'])
      var response = await web.getDocInfo(state.file['@rid'])
      state.file = response

    }

    async function unLinkEntity(entityID) {
      console.log(entityID)
      console.log(state.file['@rid'])
      await web.unLinkEntity(entityID, state.file['@rid'])
      var response = await web.getDocInfo(state.file['@rid'])
      state.file = response
    }

    async function deleteOrOpenEntity(event, entityID) {
      if (state.isCtrlPressed) {
        await unLinkEntity(entityID)
      } else {
        console.log('show');
      }
    }

    function handleKeyDown(event) {
      if (event.ctrlKey) {
        state.isCtrlPressed = true;
      }
    }

    function handleKeyUp(event) {
      state.isCtrlPressed = false;
      if(event.key == 'ArrowLeft') prev()
      if(event.key == 'ArrowRight') next()
    }

    async function load() {
      state.file = null
      state.file_count = store.file_count || null
      if(store.skip >= 0) state.skip = store.skip + 1
      else state.skip = null

      var f = await web.getNodeFile(store.file['@rid'])
      state.file = await web.getDocInfo(store.file['@rid'])
      state.entities = await web.getEntities()
      state.text = replaceWithBr(f)
    }


    onMounted(async()=> {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      await load()

    })

   onUnmounted(() => {
      // Clean up event listeners when the component is destroyed
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
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
    height: 100%;
    
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

.v-chip {
  margin: 2px;
}

.v-list-group__items .v-list-item {
  padding-left: 30px;
}
</style>