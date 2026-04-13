<template>
    <v-container fluid class="pa-0">
      <v-row no-gutters class="fill-height">
        <!-- LEFT COLUMN - Source Image with OCR overlay -->
        <v-col cols="5" class="image-column">
          <v-sheet class="d-flex flex-column fill-height">
            <v-sheet v-if="state.file && (state.file.type === 'pdf' || state.file.type === 'image' || state.sourceImagePath)" 
                    class="flex-grow-1 d-flex align-center justify-center pa-2">
              <div class="image-wrapper">
                <img :src="apiUrl + '/api/thumbnails/' + (state.sourceImagePath || state.file.path)" 
                     class="responsive-image" 
                     :style="{ maxHeight: 'calc(100vh - 200px)' }" />
                <div class="ocr-overlay">
                  <div v-for="(region, index) in state.ocrRegions" 
                       :key="index"
                       class="ocr-region"
                       :style="getRegionStyle(region)">
                    <div class="ocr-text">{{ region.text }}</div>
                  </div>
                </div>
              </div>
            </v-sheet>
          </v-sheet>
        </v-col>

        <!-- RIGHT COLUMN - Text Content -->
        <v-col cols="7" class="text-column">
          <v-sheet class="text-content pa-4" ref="textContainer">
            <div v-for="(region, index) in state.ocrRegions" 
                 :key="index"
                 class="ocr-text-item"
                 @mouseenter="handleTextHover(index)"
                 @mouseleave="handleTextLeave">
              {{ region.text }}
            </div>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
</template>

<script setup>

  import { onMounted, reactive, ref, watch } from "vue";

  import web from "../../web.js";
  import {store} from "../../components/Store.js";
  const apiUrl = import.meta.env.VITE_API_PATH

  const textContainer = ref(null)

  const emit = defineEmits(['change-tab'])
  const props = defineProps(['tab'])

  watch(() => props.tab, async () => {
    await load()
  })

  watch(() => store.file, async (newFile) => {
    if (newFile) await load()
  })

  var state = reactive({
      file: null,
      text: '',
      ocrRegions: [],
      hoveredRegionIndex: -1,
      sourceImagePath: null
  })

  function parseOCRData(ocrData) {
    try {
      if (Array.isArray(ocrData)) {
        return ocrData.map(item => {
          const coordinates = item.coordinates;
          const box = [
            [coordinates[0].x, coordinates[0].y],
            [coordinates[1].x, coordinates[1].y],
            [coordinates[2].x, coordinates[2].y],
            [coordinates[3].x, coordinates[3].y]
          ];
          
          return {
            box,
            text: item.text,
            confidence: item.confidence,
            centerY: (coordinates[0].y + coordinates[2].y) / 2,
            centerX: (coordinates[0].x + coordinates[2].x) / 2
          };
        }).sort((a, b) => {
          const verticalDiff = a.centerY - b.centerY;
          if (Math.abs(verticalDiff) > 0.02) {
            return verticalDiff;
          }
          return a.centerX - b.centerX;
        });
      }
      if (typeof ocrData === 'string') {
        const data = JSON.parse(ocrData);
        return data.map(item => {
          const coordinates = item.coordinates;
          const box = [
            [coordinates[0].x, coordinates[0].y],
            [coordinates[1].x, coordinates[1].y],
            [coordinates[2].x, coordinates[2].y],
            [coordinates[3].x, coordinates[3].y]
          ];
          
          return {
            box,
            text: item.text,
            confidence: item.confidence,
            centerY: (coordinates[0].y + coordinates[2].y) / 2,
            centerX: (coordinates[0].x + coordinates[2].x) / 2
          };
        }).sort((a, b) => {
          const verticalDiff = a.centerY - b.centerY;
          if (Math.abs(verticalDiff) > 0.02) {
            return verticalDiff;
          }
          return a.centerX - b.centerX;
        });
      }
      console.warn('Unexpected OCR data format:', ocrData);
      return [];
    } catch (e) {
      console.error('Error processing OCR data:', e);
      return [];
    }
  }

  function getRegionStyle(region) {
    const [x1, y1] = region.box[0];
    const [x2, y2] = region.box[1];
    const [x3, y3] = region.box[2];
    
    return {
      position: 'absolute',
      left: `${x1 * 100}%`,
      top: `${y1 * 100}%`,
      width: `${(x2 - x1) * 100}%`,
      height: `${(y3 - y1) * 100}%`,
      border: '2px solid rgba(255, 0, 0, 0.8)',
      backgroundColor: 'rgba(255, 0, 0, 0.2)',
      pointerEvents: 'none',
      opacity: state.hoveredRegionIndex === state.ocrRegions.indexOf(region) ? 1 : 0,
      transition: 'opacity 0.2s ease',
      zIndex: state.hoveredRegionIndex === state.ocrRegions.indexOf(region) ? 1 : 0
    };
  }

  function handleTextHover(index) {
    state.hoveredRegionIndex = index;
  }

  function handleTextLeave() {
    state.hoveredRegionIndex = -1;
  }

  function replaceWithBr(text) {
    if(typeof text == 'string') {
      return text.replace(/\n/g, "<br />")
    } else {
      return text
    }
  }

  async function load() {
    state.file = null
    state.sourceImagePath = null

    var f = await web.getNodeFile(store.file['@rid'])
    state.file = store.file
    state.text = replaceWithBr(f)
    state.ocrRegions = parseOCRData(f)

    // Try to get source image for OCR overlay
    try {
      const ancestors = await web.getFileAncestors(store.file['@rid'])
      if (ancestors && ancestors.length) {
        const imageAncestor = ancestors.find(a => a.type === 'image')
        if (imageAncestor) state.sourceImagePath = imageAncestor.path
      }
    } catch (e) {
      // fallback: no source image
    }
  }

  onMounted(async()=> {
    await load()
  })

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

.image-wrapper {
  position: relative;
  display: inline-block;
}

.ocr-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.ocr-region {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ocr-text {
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.ocr-text-item {
  display: inline-block;
  margin: 2px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.ocr-text-item:hover {
  background: rgba(0, 0, 0, 0.1);
}
</style>