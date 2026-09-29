<script setup>
// Tools of the ROI editor: drawing tool, saving, and the list of regions
// with their labels.
const tool = defineModel('tool', { type: String, default: 'rect' })
const showLabels = defineModel('showLabels', { type: Boolean, default: true })
const autoSave = defineModel('autoSave', { type: Boolean, default: true })
const selectedId = defineModel('selectedId', { type: String, default: null })

defineProps({
  shapes: { type: Array, required: true },
  dirty: { type: Boolean, default: false },
  canFinishPolygon: { type: Boolean, default: false },
})

const emit = defineEmits(['finish-polygon', 'save', 'rename', 'label-changed', 'delete'])

const ICONS = {
  rect: 'mdi-shape-rectangle-plus',
  circle: 'mdi-circle-outline',
  polygon: 'mdi-shape-polygon-plus',
}
</script>

<template>
  <aside class="roi-tools">
    <h2 class="roi-tools__title">Regions of interest</h2>
    <v-switch
      v-model="autoSave"
      label="Save automatically"
      color="primary"
      density="compact"
      inset
      hide-details
    />
    <v-switch
      v-model="showLabels"
      label="Show labels"
      color="primary"
      density="compact"
      inset
      hide-details
    />
    <template v-if="!autoSave">
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        block
        :disabled="!dirty"
        class="mt-2"
        @click="emit('save')"
      >
        Save changes
      </v-btn>
      <v-alert v-if="dirty" type="warning" variant="tonal" density="compact" class="mt-2"
        >Unsaved changes</v-alert
      >
    </template>

    <h3 class="roi-tools__heading">Draw</h3>
    <v-btn-toggle v-model="tool" mandatory density="comfortable" divided variant="outlined">
      <v-btn value="rect" :prepend-icon="ICONS.rect">Rect</v-btn>
      <v-btn value="circle" :prepend-icon="ICONS.circle">Circle</v-btn>
      <v-btn value="polygon" :prepend-icon="ICONS.polygon">Polygon</v-btn>
    </v-btn-toggle>
    <p v-if="tool === 'polygon'" class="roi-tools__hint">
      Click to add points; double-click or Finish to close.
    </p>
    <v-btn
      v-if="canFinishPolygon"
      size="small"
      variant="outlined"
      class="mt-2"
      @click="emit('finish-polygon')"
    >
      Finish polygon
    </v-btn>

    <h3 class="roi-tools__heading">Regions</h3>
    <p v-if="!shapes.length" class="roi-tools__hint">
      No regions yet. Pick a tool and draw on the image.
    </p>
    <v-list density="compact" class="roi-tools__list">
      <v-list-item
        v-for="shape in shapes"
        :key="shape.id"
        :active="shape.id === selectedId"
        color="primary"
        :prepend-icon="ICONS[shape.type] || ICONS.rect"
        @click="selectedId = shape.id"
      >
        <v-text-field
          :model-value="shape.label"
          :aria-label="`Label of region ${shape.label || shape.id}`"
          placeholder="Label"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="(label) => emit('rename', shape.id, label)"
          @blur="emit('label-changed')"
          @click.stop
        />
        <template #append>
          <v-btn
            icon="mdi-delete-outline"
            size="x-small"
            variant="text"
            aria-label="Delete region"
            @click.stop="emit('delete', shape.id)"
          />
        </template>
      </v-list-item>
    </v-list>
  </aside>
</template>

<style scoped>
.roi-tools {
  min-height: 0;
  overflow-y: auto;
  padding: var(--md-space-4);
  border-inline-start: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.roi-tools__title {
  margin: 0 0 var(--md-space-2);
  font-size: var(--md-font-size-lg);
}

.roi-tools__heading {
  margin: var(--md-space-4) 0 var(--md-space-2);
  font-family: var(--md-font-body) !important;
  font-size: var(--md-font-size-xs);
  font-weight: var(--md-font-weight-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--md-color-text-muted);
}

.roi-tools__hint {
  margin: var(--md-space-2) 0 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
