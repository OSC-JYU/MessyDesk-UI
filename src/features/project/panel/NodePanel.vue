<script setup>
import { computed, ref } from 'vue'
import { setNodeAttribute } from '@/api/projects.js'
import { useWorkspace } from '../useWorkspace.js'
import EditableText from './EditableText.vue'
import NodeTools from './NodeTools.vue'
import ProcessInfo from './ProcessInfo.vue'
import ProcessDetailsDialog from './ProcessDetailsDialog.vue'
import ThumbnailImage from '@/ui/ThumbnailImage.vue'

// Right-hand panel of the desk: the selected node's label, description,
// preview and tools, or an introduction when nothing is selected.
const workspace = useWorkspace()
const node = computed(() => workspace.state.selected)
const detailsOpen = ref(false)

const isProcess = computed(() => ['process', 'setprocess'].includes(node.value?.type))

function saver(key) {
  return async (value) => {
    await setNodeAttribute(node.value.id, { key, value })
    node.value.data[key] = value
  }
}

const saveLabel = async (value) => {
  if (!value.trim()) throw new Error('A label cannot be empty.')
  await saver('label')(value)
}
</script>

<template>
  <aside class="node-panel" aria-label="Selected item">
    <template v-if="node && node.id !== 'empty-desk'">
      <code class="node-panel__rid">{{ node.id }}</code>
      <EditableText
        :value="node.data.label"
        label="Label"
        placeholder="Add a label"
        :save="saveLabel"
      >
        <template #default="{ value }">
          <h2 class="node-panel__title">{{ value || 'Add a label' }}</h2>
        </template>
      </EditableText>
      <p v-if="node.data.count" class="node-panel__muted">{{ node.data.count }} files</p>
      <EditableText
        :value="node.data.description"
        label="Description"
        placeholder="Add a description"
        multiline
        :save="saver('description')"
      />

      <v-btn
        v-if="isProcess"
        size="small"
        variant="tonal"
        prepend-icon="mdi-eye-outline"
        class="mt-3"
        @click="detailsOpen = true"
      >
        Show details
      </v-btn>
      <ProcessInfo v-if="isProcess" :node="node" />
      <v-alert v-if="node.data.error" type="error" variant="tonal" density="compact" class="mt-3">
        Something went wrong in this cruncher.
      </v-alert>

      <div class="node-panel__content">
        <ThumbnailImage
          v-if="['image', 'pdf'].includes(node.type) && node.data.image"
          :src="node.data.image"
          class="node-panel__image"
        />
        <p v-if="node.data.info" class="node-panel__info">
          <v-icon icon="mdi-information-outline" size="16" aria-hidden="true" />
          {{ node.data.info }}
        </p>
        <pre v-if="node.data.metadata" class="node-panel__meta">{{ node.data.metadata }}</pre>
        <NodeTools :node="node" />
      </div>

      <footer class="node-panel__footer">
        <v-btn
          color="error"
          variant="tonal"
          size="small"
          prepend-icon="mdi-delete-outline"
          @click="workspace.askDelete(node)"
          >Delete</v-btn
        >
      </footer>
      <ProcessDetailsDialog v-if="isProcess" v-model="detailsOpen" :node="node" />
    </template>

    <div v-else>
      <h2 class="node-panel__title">{{ workspace.state.desk?.label || 'Desk' }}</h2>
      <p v-if="workspace.state.desk?.description" class="node-panel__muted">
        {{ workspace.state.desk.description }}
      </p>
      <v-alert type="info" variant="tonal" density="compact" class="my-3">
        Upload files and click the cookie on a file to see what crunchers can do with it.
      </v-alert>
      <p>
        Here you see your files and how you have <strong>processed</strong> them with crunchers.
      </p>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-upload"
        @click="workspace.uploadToDesk()"
      >
        Upload file
      </v-btn>
    </div>
  </aside>
</template>

<style scoped>
.node-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: var(--md-space-5);
  border-inline-start: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.node-panel__rid {
  align-self: flex-start;
  padding: var(--md-space-1) var(--md-space-2);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-bg);
  font-size: var(--md-font-size-xs);
}

.node-panel__title {
  margin: var(--md-space-2) 0;
  font-size: var(--md-font-size-xl);
  word-break: break-word;
}

.node-panel__muted,
.node-panel__info {
  color: var(--md-color-text-muted);
}

.node-panel__content {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-3);
  margin-block-start: var(--md-space-4);
}

.node-panel__image {
  max-width: 100%;
  border-radius: var(--md-radius-md);
  box-shadow: var(--md-shadow-1);
}

.node-panel__meta {
  margin: 0;
  padding: var(--md-space-2);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-bg);
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-xs);
  white-space: pre-wrap;
}

.node-panel__footer {
  display: flex;
  justify-content: flex-end;
  margin-block-start: auto;
  padding-block-start: var(--md-space-4);
  border-top: 1px solid var(--md-color-border);
}
</style>
