<style scoped>
.node-wrapper {
  width: 100%;
  height: 100%;
}

.node-body {
  width: 110px;
  height: 110px;
  border-radius: 999px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: none;
}

.search-icon {
  opacity: 0.95;
}

:deep(.vue-flow__node-search-set) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

:deep(.vue-flow__node-search-set.selected),
:deep(.vue-flow__node-search-set:focus),
:deep(.vue-flow__node-search-set:focus-visible) {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}
</style>

<script setup>
import { Handle, Position } from '@vue-flow/core'

defineProps({
  data: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="node-wrapper nodrag" :title="data.label || 'Search Index'">
    <div class="node-body">
      <v-icon class="search-icon" size="58" color="teal-darken-3">mdi-magnify</v-icon>
    </div>

    <Handle id="a" type="target" :position="Position.Left" />
    <Handle id="b" type="source" :position="Position.Right" />
  </div>
</template>
