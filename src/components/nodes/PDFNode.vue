<style scoped>
.node-pdf {
  min-height: 200px;
  cursor: pointer;
}

.pdf-icon-wrap {
  min-height: 190px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, #fff7f7 0%, #f2ecec 65%, #e8e2e2 100%);
  border: 1px solid #d6c7c7;
  border-radius: 10px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 8px rgba(92, 41, 41, 0.1);
}

.pdf-icon {
  opacity: 0.94;
  filter: drop-shadow(0 2px 3px rgba(90, 0, 0, 0.2));
}

.pdf-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #7a2020;
  background: #ffffffcc;
  border: 1px solid #e5caca;
  border-radius: 999px;
  padding: 2px 10px;
}

img {
  max-width:190px;
  margin: 0px
}
.node-pdf .header {
  background-color: #9b4949;
  color: white; 
  padding:3px
}

.crunch_add {
  color: #458b55;
  position: absolute;
  height: 50px;
  top: -40px;
  right: -40px;
  cursor: pointer;

}
.crunch_add:hover {
  fill: #099f18;
  line-height: red;
  size: 120%;
  background-color: white;
}

.roi_add {
  position: relative;
  padding-left: 10px;
  color: white;
  top: 0px;
  right: 0px;
  background-color: #54546f;
}
</style>


<script setup>
import { computed } from 'vue'
import { Handle, Position, useNode } from '@vue-flow/core'
import { useRouter, useRoute } from 'vue-router'
import {store} from "../Store.js";

import CookieIcon from '@/assets/images/cookie-bite-solid_blue.svg';

const router = useRouter();
const route = useRoute();

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})


const { node } = useNode()

const showPdfIcon = computed(() => {
  const isPdf = props.data?._type === 'pdf' || props.data?.type === 'pdf'
  return isPdf && (!props.data?.forward || !props.data?.image)
})

const thumbnailSrc = computed(() => {
  const base = props?.data?.image
  if(!base) return ''
  const version = props?.data?.thumbnail_version
  if(version === undefined || version === null || version === '') return base
  return String(base).includes('?') ? `${base}&v=${version}` : `${base}?v=${version}`
})


function openCrunchers() {
  store.current_node = node
  store.crunchers_open = true
  store.cruncher_filter = ''
}

</script>

<template>
  <div class="node-pdf nodrag">
    <div class="header">{{ data.label }}</div>
    <img @click="openCrunchers(node.id)" title="Add cruncher" class ="crunch_add" :src="CookieIcon" />
    <div class="m-2">
      <div v-if="showPdfIcon" class="pdf-icon-wrap">
        <v-icon class="pdf-icon" size="120" color="red-darken-2">mdi-file-pdf-box</v-icon>
        <div class="pdf-label">PDF blob</div>
      </div>
      <img v-else :key="thumbnailSrc" :src="thumbnailSrc" draggable="false"/>
      <pre>{{ data.description }}</pre>
      <v-chip v-if="data.model" color="green" variant="outlined">
        {{ data.model }}
      </v-chip>

    </div>

    <div v-if="data?.metadata"  class="roi_add"  >
      {{ data.metadata.page_count || 'n/a' }} pages {{ data.metadata.size }} MB
    </div>

    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="r" type="target" :position="Position.Right" />

    <Handle id="b" type="source" :position="Position.Right" /> 
    <Handle id="t" type="source" :position="Position.Top" /> 
    <Handle id="l" type="source" :position="Position.Left" /> 
  </div>

</template>