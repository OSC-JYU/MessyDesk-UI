<script setup>
import { computed, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProjects } from '@/api/projects.js'
import { ui } from '@/stores/ui.js'
import { createWorkspace } from './useWorkspace.js'
import ProjectDrawer from './ProjectDrawer.vue'
import NodePanel from './panel/NodePanel.vue'
import CrunchersDialog from './dialogs/CrunchersDialog.vue'
import DeleteNodeDialog from './dialogs/DeleteNodeDialog.vue'
import CreateSetDialog from './dialogs/CreateSetDialog.vue'
import CreateSourceDialog from './dialogs/CreateSourceDialog.vue'
import UploadController from './dialogs/UploadController.vue'

// One desk: the graph with the node panel beside it, or the desk's search,
// tags or file viewer (child routes). Holds the workspace the graph, nodes,
// panel and dialogs share.
const route = useRoute()
const workspace = createWorkspace(`#${String(route.params.rid).replace('#', '')}`)
const onGraph = computed(() => route.name === 'project-graph')

async function loadDesk() {
  try {
    const desk = (await getProjects()).find((p) => p['@rid'] === workspace.state.deskRid)
    workspace.state.desk = desk ? { label: desk.label, description: desk.description } : null
    ui.projectLabel = desk?.label || ''
  } catch {
    ui.projectLabel = ''
  }
}

watch(
  () => route.params.rid,
  (rid) => {
    if (!rid) return
    workspace.state.deskRid = `#${String(rid).replace('#', '')}`
    workspace.select(null)
    loadDesk()
    workspace.reload()
  },
  { immediate: true },
)

onUnmounted(() => {
  ui.projectLabel = ''
  ui.drawerOpen = false
})
</script>

<template>
  <div class="workspace" :class="{ 'workspace--graph': onGraph }">
    <ProjectDrawer />
    <div class="workspace__main">
      <router-view v-slot="{ Component }">
        <keep-alive include="GraphCanvas">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
    <NodePanel v-if="onGraph" class="workspace__panel" />

    <CrunchersDialog />
    <DeleteNodeDialog />
    <CreateSetDialog />
    <CreateSourceDialog />
    <UploadController />
  </div>
</template>

<style scoped>
.workspace {
  display: flex;
  height: 100%;
  min-height: 0;
}

.workspace__main {
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.workspace__panel {
  width: calc(var(--md-card-min-width) * 1.3);
  flex-shrink: 0;
}
</style>
