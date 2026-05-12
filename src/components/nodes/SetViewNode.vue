<style scoped>
img {
  max-width:280px;
  margin: 0px
}
.node-image {
  padding: 0;
}
.header {
  background: linear-gradient(180deg, #f8fbfb 0%, #eef3f3 100%);
  color: #16363a;
  border-bottom: 1px solid rgba(43, 74, 77, 0.14);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  padding: 6px 8px;
  display: block;
  opacity: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}


.image_display {

  max-height: 250px;}

.v-chip {
  margin-top: 6px;
  margin-left:10px;
}

.pdf-icon-wrap {
  width: 100%;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #fff8f8 0%, #f2ecec 65%, #e7e1e1 100%);
  border-radius: 8px;
  border: 1px solid #dbc9c9;
}

.pdf-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #7a2020;
  background: #ffffffcc;
  border: 1px solid #e5caca;
  border-radius: 999px;
  padding: 2px 10px;
}

.snippet {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  line-height: 1.35;
  color: #223437;
  font-size: 13px;
}

.snippet :deep(em) {
  background: #ffeb3b80;
  font-style: normal;
  font-weight: 700;
  padding: 0 2px;
  border-radius: 2px;
}

.node-content {
  max-height: 360px;
  padding: 0;
  overflow: hidden;
  position: relative;
}

.node-content.snippet-priority {
  max-height: none;
  overflow: visible;
}

.description-inline {
  width: 100%;
  background: #f8fbfb;
  border-top: 1px solid rgba(39, 66, 70, 0.1);
  color: #223437;
  padding: 8px 10px;
}

.preview-row {
  min-height: 78px;
}
</style>


<script setup>
import {store} from "../Store.js";

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  showExpand: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['expand-node'])

function thumbnailSrc(fileData) {
  if(!fileData?.thumb) return ''
  const base = String(fileData.thumb)
  const fullPath = base.endsWith('/thumbnail.jpg') ? base : `${base}/thumbnail.jpg`
  const version = fileData.thumbnail_version
  if(version === undefined || version === null || version === '') return fullPath
  return fullPath.includes('?') ? `${fullPath}&v=${version}` : `${fullPath}?v=${version}`
}

</script>


<template>
  <div class="node-image nodrag cursor-pointer" >
    
    <div class="header" :title="data.label || data['@rid'] || 'Untitled file'">{{ data.label || data['@rid'] || 'Untitled file' }}</div>
    
    
    <v-container class="node-content" :class="{ 'snippet-priority': data.description_html }">




      <v-row >
        <v-chip v-if="!data.is_group && store.settings_show_entities" v-for="entity of data.entities" :key="entity.id"  :color="entity.color" ><v-icon v-if="entity.icon" :icon="'mdi-' + entity.icon.toLowerCase()" start></v-icon> {{ entity.label }}</v-chip>
        <v-chip v-if="data.is_group" color="teal-darken-2" variant="flat">{{ data.file_count || 0 }} files</v-chip>
      </v-row>
      <v-row
        v-if="data.is_group || data.type == 'image' || data.type == 'pdf' || data.info"
        class="preview-row"
      >
        <v-col class="d-flex align-center justify-center">
          <div v-if="data.is_group" class="pdf-icon-wrap">
            <img v-if="data.thumb" :key="`group-${thumbnailSrc(data)}`" :src="thumbnailSrc(data)" draggable="false" style="width: 100%; height: auto;" />
            <v-icon v-else size="90" color="blue-grey-darken-1">mdi-folder-multiple-image</v-icon>
            <div class="pdf-label">Open source group</div>
          </div>
          <img v-else-if="data.type == 'image'" :key="`image-${thumbnailSrc(data)}`" :src="thumbnailSrc(data)" draggable="false" style="width: 100%; height: auto;" />
          <img v-else-if="data.type == 'pdf' && data.thumb" :key="`pdf-${thumbnailSrc(data)}`" :src="thumbnailSrc(data)" draggable="false" style="width: 100%; height: auto;" />
          <div v-else-if="data.type == 'pdf'" class="pdf-icon-wrap">
            <v-icon size="90" color="red-darken-2">mdi-file-pdf-box</v-icon>
            <div class="pdf-label">PDF blob</div>
          </div>
          <div v-else>{{ data.info }}</div>
        </v-col>
      </v-row>


      <v-row 
        v-if="data.description" 
        :class="[data.description_html ? 'description-inline' : 'description-overlay', 'm-0']">
        <v-col class="d-flex justify-center">
          <div v-if="data.description_html" class="snippet" v-html="data.description_html"></div>
          <pre v-else style="margin: 0; overflow-wrap: break-word;">{{ data.description }}</pre>
        </v-col>
      </v-row>

    </v-container>

  </div>

</template>