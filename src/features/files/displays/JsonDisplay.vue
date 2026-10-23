<script setup>
import { computed } from 'vue'
import DisplayFrame from './DisplayFrame.vue'
import { asText, useFileContent } from '../useFileContent.js'

// Any file shown as pretty-printed JSON or plain text.
const props = defineProps({ file: { type: Object, required: true } })
const { state } = useFileContent(() => props.file)
const text = computed(() => asText(state.content))
</script>

<template>
  <DisplayFrame :loading="state.loading" :error="state.error">
    <pre class="json-display">{{ text }}</pre>
  </DisplayFrame>
</template>

<style scoped>
.json-display {
  margin: 0;
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-sm);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
