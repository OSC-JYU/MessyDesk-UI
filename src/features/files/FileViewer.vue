<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { fileBrowse } from '@/stores/fileBrowse.js'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import BrowseBar from './BrowseBar.vue'
import LineagePanel from './LineagePanel.vue'
import FileToolsPanel from './tools/FileToolsPanel.vue'
import RoiEditor from './roi/RoiEditor.vue'
import { displays } from './displays/index.js'
import { displayFor } from './fileTypes.js'
import { levelLabel, nodeIcon } from './lineage.js'
import { useFileViewer } from './useFileViewer.js'
import { useQuickEdit } from './useQuickEdit.js'

// The file viewer: lineage on the left, the file in the middle (shown by
// the display for its type, or the ROI editor), tools on the right. A file
// picked in the lineage can open beside the file (side by side, source on the
// left); the tools then fold away to give the files room.
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

const comparing = computed(() => viewer.nav.compareOffset !== 0)
const compare = computed(() => fileBrowse.compare)
const compareName = computed(() => (compare.value ? displayFor(compare.value) : ''))
const compareProps = computed(() =>
  compareName.value === 'text' ? { markdown: fileBrowse.markdown } : {},
)

// The tools make way for the second file, and come back when it closes.
let toolsBefore = null
watch(
  comparing,
  (on) => {
    if (on) {
      toolsBefore = panels.value.tools
      panels.value.tools = true
    } else if (toolsBefore !== null) {
      panels.value.tools = toolsBefore
      toolsBefore = null
    }
  },
  { immediate: true },
)

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
    <LineagePanel
      v-model:collapsed="panels.lineage"
      :context-rid="viewer.nav.contextRid"
      :selected-rid="file?.['@rid']"
      :level="Math.abs(viewer.nav.offset)"
      :compare-rid="compare?.['@rid'] || null"
      :side-by-side="viewer.sideBySide.value"
      @open="viewer.openInLineage"
      @toggle-side-by-side="viewer.toggleSideBySide"
    />

    <div class="viewer__main">
      <BrowseBar
        :context="fileBrowse.context"
        :file="file"
        @prev="viewer.step(-1)"
        @next="viewer.step(1)"
        @back="viewer.back"
        @close="viewer.close"
      />

      <main class="viewer__display">
        <section v-if="comparing" class="viewer__pane" aria-label="Source file">
          <header class="viewer__pane-head">
            <v-icon
              :icon="compare ? nodeIcon(compare) : 'mdi-file-outline'"
              size="18"
              aria-hidden="true"
            />
            <span class="viewer__pane-label" :title="compare?.label">{{
              compare?.label || '…'
            }}</span>
            <v-chip size="x-small" label variant="tonal">{{
              levelLabel(viewer.nav.compareOffset)
            }}</v-chip>
            <v-spacer />
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              aria-label="Close the second file"
              @click="viewer.closeCompare"
            />
          </header>
          <div class="viewer__pane-body">
            <LoadingState v-if="viewer.nav.compareLoading" text="Opening the file…" />
            <EmptyState
              v-else-if="!compare"
              icon="mdi-source-branch-remove"
              title="No file here"
              text="This file has no source at this level of the lineage."
            />
            <EmptyState
              v-else-if="compare._file_removed"
              icon="mdi-file-remove-outline"
              title="This file was deleted"
            />
            <component
              :is="displays[compareName]"
              v-else
              :key="compare['@rid']"
              :file="compare"
              v-bind="compareProps"
            />
          </div>
        </section>

        <section class="viewer__pane" :aria-label="comparing ? 'Browsed file' : undefined">
          <header v-if="comparing" class="viewer__pane-head">
            <v-icon
              :icon="file ? nodeIcon(file) : 'mdi-file-outline'"
              size="18"
              aria-hidden="true"
            />
            <span class="viewer__pane-label" :title="file?.label">{{ file?.label || '…' }}</span>
            <v-chip size="x-small" label variant="tonal">current</v-chip>
          </header>
          <div class="viewer__pane-body">
            <LoadingState v-if="viewer.nav.loading && !file" text="Opening the file…" />
            <ErrorAlert
              v-else-if="viewer.nav.error"
              :error="viewer.nav.error"
              title="Could not open the file"
              class="ma-6"
            />
            <EmptyState
              v-else-if="file?._file_removed"
              icon="mdi-file-remove-outline"
              title="This file was deleted"
              text="It was removed from the disk when it was split into pages, so there is nothing to show. Its pages are in the set made from it."
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
          </div>
        </section>
      </main>
    </div>

    <FileToolsPanel
      v-if="file && !fileBrowse.roiTarget && !file._file_removed"
      v-model:collapsed="panels.tools"
      v-model:markdown="fileBrowse.markdown"
      :file="file"
      :edit="quick.edit"
      :can-edit-text="displayName === 'text'"
      :desk-rid="viewer.deskRid.value"
      @file-updated="(updated) => (fileBrowse.file = updated)"
      @quick-edit="quick.act"
    />
  </div>
</template>

<style scoped>
.viewer {
  display: flex;
  height: 100%;
  min-height: 0;
  background: var(--md-color-bg);
}

/* lineage on the left and tools on the right run the full height, like the panels of the set
   view; the bar is above the file only */
.viewer__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.viewer__display {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--md-color-surface);
}

.viewer__pane {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.viewer__pane + .viewer__pane {
  border-inline-start: 2px solid var(--md-color-border);
}

.viewer__pane-head {
  display: flex;
  min-height: 2.5rem;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-1) var(--md-space-3);
  border-bottom: 1px solid var(--md-color-border);
  background: var(--md-color-bg);
  font-size: var(--md-font-size-sm);
}

.viewer__pane-label {
  overflow: hidden;
  font-weight: var(--md-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer__pane-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
