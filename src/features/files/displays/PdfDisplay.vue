<script setup>
import { computed } from 'vue'
import { fileUrl } from '../fileUrls.js'

const props = defineProps({ file: { type: Object, required: true } })
const src = computed(() => fileUrl(props.file['@rid']))
</script>

<template>
  <iframe :src="src" :title="file.label || 'PDF'" class="pdf-display" />
</template>

<style scoped>
.pdf-display {
  width: 100%;
  height: 100%;
  border: 0;
}
</style>
