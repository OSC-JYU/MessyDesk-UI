<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { fileBrowse } from '@/stores/fileBrowse.js'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import BrowseBar from './BrowseBar.vue'
import LineagePanel from './LineagePanel.vue'
import FileToolsPanel from './tools/FileToolsPanel.vue'
import RoiEditor from './roi/RoiEditor.vue'
import { displays } from './displays/index.js'
import { displayFor } from './fileTypes.js'
import { useFileViewer } from './useFileViewer.js'
import { useQuickEdit } from './useQuickEdit.js'

// The file viewer: lineage on the left, the file in the middle (shown by
// the display for its type, or the ROI editor), tools on the right.
const viewer = useFileViewer()
const display = ref(null)
const file = computed(() => fileBrowse.file)
const displayName = computed(() => displayFor(file.value))
const quick = useQuickEdit(
  () => file.value,
  () => display.value,
  (updated) => (fileBrowse.file = updated),
)

const panels = ref({ lineage: false, tools: false })

const displayProps = computed(() => {
  if (displayName.value === 'image') {
    return {
      rotation: quick.edit.rotation,
      cropMode: quick.edit.cropMode,
      version: quick.edit.version,
    }
  }
  if (displayName.value === 'text') return { markdown: fileBrowse.markdown }
  return {}
})

watch(() => file.value?.['@rid'], quick.reset)

// Arrow keys move through the set or result list, unless typing.
function onKey(event) {
  if (event.target?.closest?.('input, textarea, [contenteditable="true"]')) return
  if (event.key === 'ArrowLeft') viewer.step(-1)
  if (event.key === 'ArrowRight') viewer.step(1)
}

onMounted(() => window.addEventListener('keyup', onKey))
onUnmounted(() => window.removeEventListener('keyup', onKey))
</script>

<template>
  <div class="viewer">
    <BrowseBar
      :context="fileBrowse.context"
      :file="file"
      @prev="viewer.step(-1)"
      @next="viewer.step(1)"
      @back="viewer.back"
      @close="viewer.close"
    />
    <div class="viewer__body">
      <LineagePanel
        v-model:collapsed="panels.lineage"
        :context-rid="viewer.nav.contextRid"
        :selected-rid="file?.['@rid']"
        :level="Math.abs(viewer.nav.offset)"
        @open="viewer.openInLineage"
      />

      <main class="viewer__display">
        <LoadingState v-if="viewer.nav.loading && !file" text="Opening the file…" />
        <ErrorAlert
          v-else-if="viewer.nav.error"
          :error="viewer.nav.error"
          title="Could not open the file"
          class="ma-6"
        />
        <template v-else-if="file">
          <RoiEditor v-if="fileBrowse.roiTarget" :file="file" :target="fileBrowse.roiTarget" />
          <component
            :is="displays[displayName]"
            v-else
            ref="display"
            :key="displayName"
            :file="file"
            v-bind="displayProps"
            @crop-selection-change="(has) => (quick.edit.hasCrop = has)"
          />
        </template>
      </main>

      <FileToolsPanel
        v-if="file && !fileBrowse.roiTarget"
        v-model:collapsed="panels.tools"
        v-model:markdown="fileBrowse.markdown"
        :file="file"
        :edit="quick.edit"
        :can-edit-text="displayName === 'text'"
        @refresh="quick.act('refresh')"
        @file-updated="(updated) => (fileBrowse.file = updated)"
        @quick-edit="quick.act"
      />
    </div>
  </div>
</template>

<style scoped>
.viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--md-color-bg);
}

.viewer__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.viewer__display {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--md-color-surface);
}
</style>
