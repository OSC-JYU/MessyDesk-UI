<template>
  <v-sheet class="file-tools" :class="{ 'collapsed': collapsed }">
    <!-- Collapse toggle -->
    <div class="tools-header d-flex align-center" :class="{ 'justify-center': collapsed, 'justify-space-between': !collapsed }">
      <span v-if="!collapsed" class="text-overline text-medium-emphasis">Tools</span>
      <v-btn icon size="x-small" variant="text" @click="$emit('toggle-collapse')">
        <v-icon size="16">{{ collapsed ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
      </v-btn>
    </div>

    <template v-if="!collapsed">
      <!-- File info (always visible, compact) -->
      <div class="tool-section-static px-3 py-2">
        <FileInfo :file="file" @refresh="$emit('refresh')" />
      </div>

      <!-- Accordion panels — all closed by default -->
      <v-expansion-panels v-model="openPanels" multiple variant="accordion" class="tool-panels">

        <!-- Tags -->
        <v-expansion-panel value="tags">
          <v-expansion-panel-title class="tool-panel-title">
            <v-icon size="16" class="mr-2">mdi-tag-outline</v-icon>
            <span>Tags</span>
            <v-chip v-if="file && file.entities && file.entities.length" size="x-small" color="primary" variant="tonal" class="ml-auto mr-2">{{ file.entities.length }}</v-chip>
          </v-expansion-panel-title>
          <v-expansion-panel-text class="tool-panel-body">
            <TagTools :file="file" :entities="entities" @file-updated="$emit('file-updated', $event)" />
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Version (only for editable types / images) -->
        <v-expansion-panel v-if="showVersion" value="version">
          <v-expansion-panel-title class="tool-panel-title">
            <v-icon size="16" class="mr-2">mdi-history</v-icon>
            <span>Version</span>
            <v-chip v-if="file && file.edited" size="x-small" color="orange" variant="tonal" class="ml-auto mr-2">edited</v-chip>
          </v-expansion-panel-title>
          <v-expansion-panel-text class="tool-panel-body">
            <VersionTools 
              :file="file" 
              :toast="toast"
              @save-edit="$emit('save-edit')" 
              @revert-edit="$emit('revert-edit')"
              @rotate-left="$emit('rotate-left')"
              @rotate-right="$emit('rotate-right')"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>
  </v-sheet>
</template>

<script setup>
import { ref, computed } from 'vue'
import FileInfo from './FileInfo.vue'
import TagTools from './TagTools.vue'
import VersionTools from './VersionTools.vue'

const props = defineProps({
  file: { type: Object, default: null },
  entities: { type: [Array, Object], default: () => ({}) },
  collapsed: { type: Boolean, default: false },
  toast: { type: Object, default: () => ({ show: false, text: '', color: 'success' }) }
})

defineEmits(['toggle-collapse', 'refresh', 'file-updated', 'save-edit', 'revert-edit', 'rotate-left', 'rotate-right'])

// All closed by default
const openPanels = ref([])

const showVersion = computed(() => {
  if (!props.file) return false
  const t = props.file.type
  const isImage = t === 'image'
  const isEditable = ['text', 'csv', 'html', 'json'].includes(t) || (t && t.endsWith('.json'))
  return isImage || isEditable || props.file.edited
})
</script>

<style scoped>
.file-tools {
  background: #fafbfc;
  height: calc(100vh - 64px);
  overflow-y: auto;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
}

.file-tools.collapsed {
  width: 36px !important;
  min-width: 36px !important;
  max-width: 36px !important;
  overflow: hidden;
}

.tools-header {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.tool-section-static {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.tool-panels {
  border-radius: 0 !important;
}

.tool-panels :deep(.v-expansion-panel) {
  border-radius: 0 !important;
  background: transparent;
}

.tool-panels :deep(.v-expansion-panel::before) {
  box-shadow: none !important;
}

.tool-panels :deep(.v-expansion-panel + .v-expansion-panel) {
  margin-top: 0;
}

.tool-panel-title {
  min-height: 40px !important;
  padding: 0 12px !important;
  font-size: 0.8rem;
  font-weight: 500;
}

.tool-panel-body {
  font-size: 0.85rem;
}

.tool-panel-body :deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 12px 12px;
}
</style>
