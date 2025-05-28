<template>
    <v-container fluid class="pa-0">
      <v-btn
        class="ma-2"
        color="primary"
        icon="mdi-close"
        style="position: absolute; top: 0; left: -60px; z-index:1000"
        @click="$emit('change-tab',store.tab)"
      ></v-btn>

      <v-row no-gutters class="fill-height">
        <!-- LEFT COLUMN - Image and Navigation -->
        <v-col :cols="state.expandedImage ? 5 : 3" class="image-column">
          <v-sheet class="d-flex flex-column fill-height">
            <!-- Navigation Path or Expanded Image -->
            <div class="pa-2">
              <template v-if="!state.expandedImage">
                <template v-for="node of state.nodepath">
                  <div v-if="node['@type'] !== 'User'" class="d-flex align-center">
                    <v-icon size="15" color="green">mdi-arrow-up</v-icon>
                    <div :class="'node-base ' + node['@type']+' '+node.type" class="ml-1">
                      <p>{{ node.label }}</p>
                      <img v-if="node.type === 'image'" 
                           :src="apiUrl + '/api/thumbnails/' + node.path" 
                           class="node-image" 
                           @click="toggleImageExpand(node.path)"
                           alt="Node image" />
                    </div>
                  </div>
                </template>
              </template>
              <template v-else>
                <div class="expanded-image-container" 
                     @wheel="handleImageWheel"
                     @mousedown="startPanning"
                     @mousemove="handlePanning"
                     @mouseup="stopPanning"
                     @mouseleave="stopPanning">
                  <img :src="apiUrl + '/api/thumbnails/' + state.expandedImage" 
                       class="expanded-image" 
                       :style="{ 
                         transform: `scale(${state.imageScale}) translate(${state.panX}px, ${state.panY}px)`,
                         cursor: state.imageScale > 1 ? (state.isPanning ? 'grabbing' : 'grab') : 'pointer'
                       }"
                       @click="handleImageClick" />
                  <v-btn
                    class="close-expanded-image"
                    icon="mdi-close"
                    size="small"
                    @click="toggleImageExpand(null)"
                  ></v-btn>
                  <!-- <div v-if="state.showGuide" class="image-guide">
                    <div class="guide-content">
                      <div class="guide-title">Image Controls</div>
                      <div class="guide-item">
                        <v-icon>mdi-mouse</v-icon>
                        <span>Scroll to zoom in/out</span>
                      </div>
                      <div class="guide-item">
                        <v-icon>mdi-gesture-drag</v-icon>
                        <span>Left click + drag to pan when zoomed</span>
                      </div>
                      <div class="guide-item">
                        <v-icon>mdi-close</v-icon>
                        <span>Click image or X to close</span>
                      </div>
                    </div>
                    <v-btn
                      class="close-guide"
                      icon="mdi-close"
                      size="x-small"
                      @click="state.showGuide = false"
                    ></v-btn>
                  </div> -->
                </div>
              </template>
            </div>

            <!-- Image Display -->
            <v-sheet v-if="state.file && (state.file.type === 'pdf' || state.file.type === 'image')" 
                    class="flex-grow-1 d-flex align-center justify-center pa-2">
              <img :src="apiUrl + '/api/thumbnails/' + state.file.path" 
                   class="responsive-image" 
                   :style="{ maxHeight: 'calc(100vh - 200px)' }" />
            </v-sheet>
          </v-sheet>
        </v-col>

        <!-- MIDDLE COLUMN - Text Content -->
        <v-col :cols="state.expandedImage ? 4 : 6" class="text-column">
          <v-sheet class="text-content pa-4" ref="textContainer" v-html="state.text"></v-sheet>
        </v-col>

        <!-- RIGHT COLUMN - Controls and Metadata -->
        <v-col cols="3" class="controls-column">
          <v-sheet class="pa-4">
            <!-- Navigation Controls -->
            <template v-if="state.file_count > 0">
              <div class="d-flex align-center justify-center mb-4">
                <v-btn @click="prev()" :disabled="state.skip == 1" color="secondary">
                  <v-icon>mdi-chevron-left</v-icon>
                </v-btn>
                <span class="mx-4">{{state.skip}} / {{state.file_count}}</span>
                <v-btn @click="next()" :disabled="state.skip == state.file_count" color="secondary">
                  <v-icon>mdi-chevron-right</v-icon>
                </v-btn>
              </div>
            </template>

            <!-- File Info -->
            <div v-if="state.file" class="mb-4">
              <h4>{{ state.file.label}}</h4>
              <DescriptionEditor :description="state.file.description" :rid="state.file['@rid']"/>
              
              <!-- Entities -->
              <v-sheet class="mt-4">
                <v-chip 
                  v-for="entity of state.file.entities" 
                  :key="entity.type" 
                  :color="entity.color" 
                  variant="outlined"
                  class="ma-1"
                  @click="deleteOrOpenEntity($event, entity.rid)"
                >
                  <v-icon :icon="'mdi-' + entity.icon.toLowerCase()" start></v-icon>
                  {{ entity.label}}
                  <v-icon v-if="state.isCtrlPressed" icon="mdi-close-circle" end></v-icon>
                </v-chip>
                <p v-if="state.file.entities && state.file.entities.length" class="text-caption mt-2">
                  Ctrl + click to remove
                </p>
              </v-sheet>
            </div>

            <!-- Tags and Selections -->
            <v-list v-model:opened="state.open">
              <v-list-group value="Tags">
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props" title="Tags"></v-list-item>
                </template>

                <v-list-group v-for="type in state.entities" :key="type.type">
                  <template v-slot:activator="{ props }">
                    <v-list-item v-bind="props" :title="type.type" :prepend-icon="'mdi-' + type.icon"></v-list-item>
                  </template>
                  <v-chip 
                    v-for="item in type.items" 
                    :key="item['@rid']" 
                    :color="item.color"
                    class="ma-1"
                    @click="linkEntityToItem(item['@rid'])"
                  >
                    <v-icon :icon="'mdi-' + item.icon.toLowerCase()" start></v-icon>
                    {{ item.label }}
                  </v-chip>
                </v-list-group>
              </v-list-group>

              <v-list-group value="Selections">
                <template v-slot:activator="{ props }">
                  <v-list-item v-bind="props" title="Selections"></v-list-item>
                </template>
                <v-alert type="info" class="mt-2">Click and drag to create saved selections (ROI).</v-alert>
                <v-alert type="warning">not implemented for text yet</v-alert>
              </v-list-group>
            </v-list>

            <!-- Open Full File Button -->
            <v-btn
              v-if="state.file"
              color="primary"
              class="mt-4"
              block
              :href="apiUrl + '/api/files/' + state.file['@rid'].replace('#','')"
              target="_blank"
            >
              Open full file
            </v-btn>
          </v-sheet>
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
      open: [],
      nodepath: [],
      expandedImage: null,
      imageScale: 1,
      panX: 0,
      panY: 0,
      isPanning: false,
      lastPanX: 0,
      lastPanY: 0,
      showGuide: true
  })

  async function prev() {
    if((state.skip -1) < 1) return
    state.ROIs = []
    state.skip = state.skip - 1
    var response = await web.getSetFiles(store.current_node.id, state.skip - 1, 1)
    state.file = response.files[0]
    var f = await web.getNodeFile(response.files[0]['@rid'])
    state.text = replaceWithBr(f)
    var nodepath = await web.getNodePath(response.files[0]['@rid'])
    state.nodepath = nodepath
  }

  async function next() {
    if((state.skip ) > state.file_count) return
    state.ROIs = []
    state.skip = state.skip + 1
    var response = await web.getSetFiles(store.current_node.id, state.skip -1 , 1)
    state.file = response.files[0]
    var f = await web.getNodeFile(response.files[0]['@rid'])
    state.text = replaceWithBr(f)
    var nodepath = await web.getNodePath(response.files[0]['@rid'])
    state.nodepath = nodepath
    
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
    if(typeof text == 'string') {
      return text.replace(/\n/g, "<br />")
    } else {
      return text
    }
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
    state.expandedImage = null
    state.file_count = store.file_count || null
    if(store.skip >= 0) state.skip = store.skip + 1
    else state.skip = null

    var f = await web.getNodeFile(store.file['@rid'])
    state.file = await web.getDocInfo(store.file['@rid'])
    state.entities = await web.getEntities()
    state.text = replaceWithBr(f)
    var nodepath = await web.getNodePath(store.file['@rid'])
    state.nodepath = nodepath
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

  function toggleImageExpand(imagePath) {
    state.expandedImage = state.expandedImage === imagePath ? null : imagePath;
    state.imageScale = 1;
    state.panX = 0;
    state.panY = 0;
    state.showGuide = true;
  }

  function handleImageWheel(event) {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const oldScale = state.imageScale;
    state.imageScale = Math.max(0.5, Math.min(3, state.imageScale + delta));
    
    // Adjust pan position to zoom towards mouse position
    if (state.imageScale > 1) {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      
      state.panX += x * (1 - oldScale/state.imageScale);
      state.panY += y * (1 - oldScale/state.imageScale);
    }
  }

  function startPanning(event) {
    // Check for left mouse button (button 0)
    if (state.imageScale > 1 && event.button === 0) {
      event.preventDefault(); // Prevent default left click behavior
      state.isPanning = true;
      state.lastPanX = event.clientX;
      state.lastPanY = event.clientY;
    }
  }

  function handlePanning(event) {
    if (state.isPanning && state.imageScale > 1) {
      event.preventDefault(); // Prevent default drag behavior
      const deltaX = event.clientX - state.lastPanX;
      const deltaY = event.clientY - state.lastPanY;
      
      state.panX += deltaX / (state.imageScale * 0.5);
      state.panY += deltaY / (state.imageScale * 0.5);
      
      state.lastPanX = event.clientX;
      state.lastPanY = event.clientY;
    }
  }

  function stopPanning() {
    state.isPanning = false;
  }

  function handleImageClick(event) {
    // Only close if we're not panning and not zoomed in
    if (state.imageScale <= 1 && !state.isPanning) {
      toggleImageExpand(null);
    }
  }

</script>

<style scoped>
.v-container {
  max-width: 100% !important;
  margin-left: 60px !important;
}

.image-column {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  height: calc(100vh - 64px);
  overflow-y: auto;
  transition: all 0.3s ease;
}

.text-column {
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.controls-column {
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  height: calc(100vh - 64px);
  overflow-y: auto;
}

.text-content {
  background-color: white;
  min-height: 100%;
}

.responsive-image {
  max-width: 100%;
  object-fit: contain;
}

.node-base {
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.05);
}

.node-image {
  max-width: 100%;
  max-height: 100px;
  margin-top: 4px;
  border-radius: 4px;
  object-fit: contain;
  cursor: pointer;
  transition: all 0.3s ease;
}

.node-image.expanded {
  max-height: calc(100vh - 200px);
  width: 100%;
  object-fit: contain;
}

.v-chip {
  margin: 2px;
}

.v-list-group__items .v-list-item {
  padding-left: 30px;
}

.expanded-image-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 100px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.expanded-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transition: transform 0.1s ease;
  transform-origin: center center;
  will-change: transform;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.close-expanded-image {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1000;
}

.image-guide {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px;
  border-radius: 8px;
  z-index: 1000;
  max-width: 250px;
}

.guide-content {
  margin-right: 24px;
}

.guide-title {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
}

.guide-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
  font-size: 12px;
}

.close-guide {
  position: absolute;
  top: 4px;
  right: 4px;
  color: white;
}
</style>