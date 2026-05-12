<template>
  <v-card v-if="inline" class="set-panel-inline" flat>
    <v-toolbar  density="compact" class="set-panel-toolbar">
      <v-toolbar-title>
        <v-btn
          v-if="setdata.mode === 'children'"
          density="compact"
          icon="mdi-arrow-left"
          class="mr-2"
          @click="$emit('back-to-groups')"
        ></v-btn>
        <v-icon size="26" color="green-lighten-2" class="mr-1">mdi-folder-outline</v-icon>
        {{ panelNode?.data?.label || panelNode?.label || 'Unnamed set' }}
        <span v-if="setdata.file_count" class="ml-1">({{ setdata.file_count }} files)</span>
        <span v-if="setdata.mode === 'groups'" class="ml-2 text-body-2">({{ setdata.group_count || 0 }} sources)</span>
        <span v-if="setdata.mode === 'children' && selectedSourceLabel" class="ml-2 text-body-2">- {{ selectedSourceLabel }}</span>
      </v-toolbar-title>

      <v-btn v-if="showClose" icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
    </v-toolbar>

    <div class="set-panel-body">
      <div v-if="loading" class="set-loading-state">
        <v-progress-circular indeterminate size="34" color="teal-darken-1" class="mb-3"></v-progress-circular>
        <div class="text-subtitle-2">Loading set contents...</div>
      </div>
      <div v-else-if="setItems.length > 0" class="set-grid">
        <v-card
          v-for="(file, index) in setItems"
          :key="(file['@rid'] || file.source_rid || index) + '-' + (file.thumbnail_version || '')"
          class="set-grid-item"
          variant="tonal"
          @dblclick="$emit('open-file', { file, index })"
        >
          <SetViewNode :data="file" :show-expand="showExpand" @expand-node="$emit('expand-node', file)" />
          <v-chip
            v-if="file.is_group"
            size="x-small"
            color="teal-darken-1"
            class="group-chip"
            @click.stop="$emit('open-group', file)"
          >
            Open source
          </v-chip>
        </v-card>
      </div>
      <div v-else class="set-empty-state">
        <v-icon size="30" class="mb-2" color="teal-darken-1">mdi-folder-search-outline</v-icon>
        <div class="text-subtitle-1">No results</div>
      </div>
    </div>

    <div class="set-panel-footer">
      <v-pagination
        :model-value="page"
        @update:model-value="$emit('update:page', $event)"
        :length="totalPages"
        :total-visible="12"
      ></v-pagination>
    </div>
  </v-card>

  <v-navigation-drawer
    v-else
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    temporary
    location="bottom"
    class="set-panel-drawer"
  >
    <v-toolbar  density="compact" class="set-panel-toolbar">
      <v-toolbar-title>
        <v-btn
          v-if="setdata.mode === 'children'"
          density="compact"
          icon="mdi-arrow-left"
          class="mr-2"
          @click="$emit('back-to-groups')"
        ></v-btn>
        <v-icon size="26" color="green-lighten-2" class="mr-1">mdi-folder-outline</v-icon>
        {{ panelNode?.data?.label || panelNode?.label || 'Unnamed set' }}
        <span v-if="setdata.file_count" class="ml-1">({{ setdata.file_count }} files)</span>
        <span v-if="setdata.mode === 'groups'" class="ml-2 text-body-2">({{ setdata.group_count || 0 }} sources)</span>
        <span v-if="setdata.mode === 'children' && selectedSourceLabel" class="ml-2 text-body-2">- {{ selectedSourceLabel }}</span>
      </v-toolbar-title>

      <v-btn v-if="showClose" icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
    </v-toolbar>

    <div class="set-panel-body">
      <div v-if="loading" class="set-loading-state">
        <v-progress-circular indeterminate size="34" color="teal-darken-1" class="mb-3"></v-progress-circular>
        <div class="text-subtitle-2">Loading set contents...</div>
      </div>
      <div v-else-if="setItems.length > 0" class="set-grid">
        <v-card
          v-for="(file, index) in setItems"
          :key="(file['@rid'] || file.source_rid || index) + '-' + (file.thumbnail_version || '')"
          class="set-grid-item"
          variant="tonal"
          @dblclick="$emit('open-file', { file, index })"
        >
          <SetViewNode :data="file" :show-expand="showExpand" @expand-node="$emit('expand-node', file)" />
          <v-chip
            v-if="file.is_group"
            size="x-small"
            color="teal-darken-1"
            class="group-chip"
            @click.stop="$emit('open-group', file)"
          >
            Open source
          </v-chip>
        </v-card>
      </div>
      <div v-else class="set-empty-state">
        <v-icon size="30" class="mb-2" color="teal-darken-1">mdi-folder-search-outline</v-icon>
        <div class="text-subtitle-1">No results</div>
      </div>
    </div>

    <div class="set-panel-footer">
      <v-pagination
        :model-value="page"
        @update:model-value="$emit('update:page', $event)"
        :length="totalPages"
        :total-visible="12"
      ></v-pagination>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import SetViewNode from '../nodes/SetViewNode.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  inline: { type: Boolean, default: false },
  showClose: { type: Boolean, default: true },
  panelNode: { type: Object, default: null },
  setdata: { type: Object, default: () => ({ mode: 'groups', file_count: 0, group_count: 0 }) },
  setItems: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  page: { type: Number, default: 1 },
  totalPages: { type: Number, default: 1 },
  selectedSourceLabel: { type: String, default: '' },
  showExpand: { type: Boolean, default: true },
  allowAddFile: { type: Boolean, default: true }
})

defineEmits([
  'update:modelValue',
  'update:page',
  'open-file',
  'expand-node',
  'open-group',
  'back-to-groups',
  'add-file'
])
</script>

<style scoped>
.set-panel-drawer {
  height: min(78vh, 760px) !important;
}

.set-panel-inline {
  background-color: #2ba8a8;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.set-panel-toolbar {
  position: sticky;
  top: 0;
  z-index: 3;
}

.set-panel-body {
  padding: 16px;
  background: linear-gradient(180deg, #eef4f4 0%, #f7fbfb 100%);
  height: calc(100% - 116px);
  overflow: auto;
}

.set-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(225px, 1fr));
  gap: 12px;
}

.set-loading-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.62);
}

.set-grid-item {
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  background: white;
  min-height: 190px;
}

.group-chip {
  margin-top: 6px;
}

.set-empty-state {
  height: 100%;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.62);
}

.set-panel-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  padding: 4px 12px;
}
</style>
