<script setup>
import { reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import '@vue-flow/core/dist/style.css'
import './graph.css'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import LoadingState from '@/ui/LoadingState.vue'
import { recall, remember } from '@/stores/pageMemory.js'
import { useWorkspace } from './useWorkspace.js'
import { useDeskGraph } from './useDeskGraph.js'
import { useOpenFile, useOpenNode } from './useOpenNode.js'
import { nodeTypes } from './nodes/index.js'
import SetBrowser from './SetBrowser.vue'

defineOptions({ name: 'GraphCanvas' })

// The desk's graph, or the set browser when a set is open.
const route = useRoute()
const router = useRouter()
const workspace = useWorkspace()
const setView = reactive({ set: null, roiSet: null, page: 1, refresh: 0 })

const desk = useDeskGraph(workspace, {
  onThumbnailsChanged: () => setView.set && setView.refresh++,
})

function openSet(set, roiSet = null) {
  const saved = recall('setBrowser', `${workspace.state.deskRid}|${set.id}`)
  Object.assign(setView, { set, roiSet, page: saved?.page || 1 })
}

function closeSet() {
  setView.set = null
}

const openNode = useOpenNode(workspace, desk.flow, { openSet })
const openFile = useOpenFile(workspace)

function onSetPage(page) {
  remember('setBrowser', `${workspace.state.deskRid}|${setView.set.id}`, { page })
}

desk.flow.onNodeClick(({ node }) => node && workspace.select(node))
desk.flow.onNodeDoubleClick(({ node }) => node && openNode(node))
desk.flow.onPaneClick(() => workspace.select(null))

// "Back to set" from the file viewer lands here with ?openSet=<rid>.
async function openSetFromQuery() {
  const rid = route.query.openSet
  if (!rid) return
  const node = desk.graph.nodes.find((n) => n.id === `#${String(rid).replace('#', '')}`)
  if (node?.type === 'set') openSet(node)
  router.replace({ name: 'project-graph', params: { rid: route.params.rid } })
}

watch(
  () => workspace.state.reloadToken,
  async () => {
    await desk.load()
    await openSetFromQuery()
  },
  { immediate: true },
)
watch(() => route.query.openSet, openSetFromQuery)
watch(
  () => workspace.state.fitRequest,
  (request) => request && desk.fitTo(request.id),
)
</script>

<template>
  <div class="desk-graph">
    <SetBrowser
      v-if="setView.set"
      :set="setView.set"
      :roi-set="setView.roiSet"
      :initial-page="setView.page"
      :refresh-token="setView.refresh"
      @page="onSetPage"
      @close="closeSet"
      @upload="workspace.uploadToSet(setView.set)"
      @open="
        (file) =>
          openFile(file.rid, {
            set: setView.set,
            roiSet: setView.roiSet,
            index: file.index,
            total: file.total,
          })
      "
    />
    <template v-else>
      <LoadingState
        v-if="desk.graph.loading && !desk.graph.nodes.length"
        text="Loading the desk…"
      />
      <ErrorAlert
        :error="desk.graph.error"
        title="Could not load the desk"
        class="desk-graph__error"
      />
      <VueFlow
        :nodes="desk.graph.nodes"
        :edges="desk.graph.edges"
        :node-types="nodeTypes"
        :nodes-connectable="false"
        :nodes-draggable="false"
        :default-zoom="0.5"
        :min-zoom="0.1"
        :max-zoom="4"
        class="desk-graph__flow"
      >
        <Background />
      </VueFlow>
      <div class="desk-graph__controls" role="toolbar" aria-label="Desk view">
        <v-btn
          size="small"
          :variant="desk.graph.isolated ? 'flat' : 'tonal'"
          :color="desk.graph.isolated ? 'primary' : undefined"
          :prepend-icon="desk.graph.isolated ? 'mdi-eye-off' : 'mdi-eye'"
          :disabled="!workspace.state.selected && !desk.graph.isolated"
          @click="desk.toggleIsolate"
        >
          {{ desk.graph.isolated ? 'Show all' : 'Isolate' }}
        </v-btn>
        <v-btn
          size="small"
          :variant="desk.graph.compact ? 'flat' : 'tonal'"
          :color="desk.graph.compact ? 'primary' : undefined"
          prepend-icon="mdi-cog-off-outline"
          @click="desk.toggleProcesses"
        >
          {{ desk.graph.compact ? 'Show processes' : 'Hide processes' }}
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          icon="mdi-fit-to-screen-outline"
          aria-label="Fit the desk to view"
          @click="desk.flow.fitView({ duration: 800 })"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.desk-graph {
  position: relative;
  height: 100%;
  background: linear-gradient(
    0deg,
    color-mix(in srgb, var(--md-color-graph) 25%, var(--md-color-bg)) 0%,
    var(--md-color-bg) 30%
  );
}

.desk-graph__flow {
  height: 100%;
}

.desk-graph__error {
  position: absolute;
  top: var(--md-space-4);
  left: var(--md-space-4);
  z-index: 1;
}

.desk-graph__controls {
  position: absolute;
  right: var(--md-space-4);
  bottom: var(--md-space-4);
  display: flex;
  gap: var(--md-space-2);
  padding: var(--md-space-2);
  border-radius: var(--md-radius-lg);
  background: var(--md-color-surface);
  box-shadow: var(--md-shadow-2);
}
</style>
