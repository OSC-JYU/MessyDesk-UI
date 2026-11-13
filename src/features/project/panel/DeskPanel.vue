<script setup>
import { ref } from 'vue'
import { resetProjectCover, setProjectAttribute, uploadProjectCover } from '@/api/projects.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import ThumbnailImage from '@/ui/ThumbnailImage.vue'
import { useWorkspace } from '../useWorkspace.js'
import EditableText from './EditableText.vue'

// The panel of the desk itself, shown when nothing is selected: the cover, the description and
// the first things to do. The cover is an uploaded image, an image file of the desk (button
// "Use as desk cover" on a selected image) or, by default, the first image.
const workspace = useWorkspace()
const input = ref(null)
const busy = ref(false)
const error = ref(null)

async function saveDescription(value) {
  await setProjectAttribute(workspace.state.deskRid, { key: 'description', value })
  workspace.state.desk.description = value
}

async function changeCover(action) {
  busy.value = true
  error.value = null
  try {
    await action()
    await workspace.refreshDesk()
  } catch (e) {
    error.value = e
  } finally {
    busy.value = false
  }
}

async function onFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) await changeCover(() => uploadProjectCover(workspace.state.deskRid, file))
}
</script>

<template>
  <div>
    <div class="desk-panel__cover">
      <ThumbnailImage
        v-if="workspace.state.desk?.cover"
        :src="workspace.state.desk.cover.url"
        alt="Desk cover"
      />
      <v-icon v-else icon="mdi-desk" size="48" aria-hidden="true" />
    </div>
    <div class="desk-panel__cover-actions">
      <v-btn
        size="x-small"
        variant="text"
        prepend-icon="mdi-upload"
        :loading="busy"
        @click="input.click()"
      >
        Upload cover
      </v-btn>
      <v-btn
        v-if="workspace.state.desk?.cover && workspace.state.desk.cover.kind !== 'first-image'"
        size="x-small"
        variant="text"
        prepend-icon="mdi-undo"
        :disabled="busy"
        @click="changeCover(() => resetProjectCover(workspace.state.deskRid))"
      >
        Use first image
      </v-btn>
      <input
        ref="input"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        @change="onFile"
      />
    </div>
    <ErrorAlert :error="error" title="Could not change the cover" class="mb-2" />
    <h2 class="desk-panel__title">{{ workspace.state.desk?.label || 'Desk' }}</h2>
    <EditableText
      :value="workspace.state.desk?.description || ''"
      label="Description"
      placeholder="Add a description"
      multiline
      :save="saveDescription"
    />
    <v-alert type="info" variant="tonal" density="compact" class="my-3">
      Upload files and click the cookie on a file to see what crunchers can do with it. Select an
      image to use it as the cover of the desk.
    </v-alert>
    <p>Here you see your files and how you have <strong>processed</strong> them with crunchers.</p>
    <div class="desk-panel__actions">
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-upload"
        @click="workspace.uploadToDesk()"
      >
        Upload file
      </v-btn>
      <v-btn
        variant="tonal"
        prepend-icon="mdi-folder-plus-outline"
        @click="workspace.openCreateSet()"
      >
        Create set
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.desk-panel__cover {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: var(--md-radius-md);
  background: var(--md-color-surface-subtle);
  color: var(--md-color-primary);
}

.desk-panel__cover :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.desk-panel__cover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
  margin-block: var(--md-space-1) var(--md-space-2);
}

.desk-panel__title {
  margin: var(--md-space-2) 0;
  font-size: var(--md-font-size-xl);
  word-break: break-word;
}

.desk-panel__actions {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}
</style>
