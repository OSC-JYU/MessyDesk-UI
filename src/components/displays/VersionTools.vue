<template>
  <div v-if="showVersion" class="version-tools">

    <v-alert
      v-if="isReference"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-2"
    >
      This file is a reference node. Quick edits are not available.
    </v-alert>

    <template v-if="file && isImage && !isReference">
      <div class="d-flex align-center justify-space-between mb-1">
        <span class="text-caption d-flex align-center">
          <v-icon size="14" class="mr-1">mdi-rotate-orbit</v-icon>
          Rotate
        </span>
        <div>
          <v-btn icon size="x-small" class="mr-1" @click="$emit('rotate-left')" title="Rotate left">
            <v-icon size="16">mdi-rotate-left</v-icon>
          </v-btn>
          <v-btn icon size="x-small" @click="$emit('rotate-right')" title="Rotate right">
            <v-icon size="16">mdi-rotate-right</v-icon>
          </v-btn>
        </div>
      </div>
      <div class="d-flex align-center justify-space-between mt-2 mb-1">
        <span class="text-caption d-flex align-center">
          <v-icon size="14" class="mr-1">mdi-crop</v-icon>
          Crop
        </span>
        <div>
          <v-btn
            v-if="!imageCropMode"
            size="x-small"
            variant="outlined"
            :disabled="thumbnailPending || hasPendingRotation"
            @click="$emit('start-crop')"
          >
            Start crop
          </v-btn>
          <template v-else>
            <v-btn
              size="x-small"
              variant="outlined"
              class="mr-1"
              :disabled="!hasImageCropSelection"
              @click="$emit('clear-crop')"
            >
              Clear
            </v-btn>
            <v-btn size="x-small" variant="outlined" @click="$emit('cancel-crop')">Cancel</v-btn>
          </template>
        </div>
      </div>

      <v-alert
        v-if="imageCropMode"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-2"
      >
        Draw one rectangle on the image.
      </v-alert>

      <v-btn v-if="hasPendingImageEdit" color="primary" block size="x-small" class="mt-1" @click="$emit('save-edit')">
        Save quick edit
      </v-btn>

      <v-alert
        v-if="thumbnailPending"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-2"
      >
        Waiting for thumbnail update...
      </v-alert>
    </template>

    <template v-if="file && isEditable && !isImage && !isReference">
      <v-btn
        v-if="!textEditMode"
        color="primary"
        block
        size="x-small"
        class="mt-1"
        :disabled="!supportsTextEditing"
        @click="$emit('start-edit')"
      >
        Start edit
      </v-btn>

      <template v-else>
        <v-btn color="primary" block size="x-small" class="mt-1" @click="$emit('save-edit')">
          Save quick edit
        </v-btn>
        <v-btn color="secondary" block size="x-small" class="mt-1" @click="$emit('cancel-edit')">
          Cancel edit
        </v-btn>
      </template>
    </template>

    <v-btn
      v-if="file && file.edited && !isReference"
      color="warning"
      block
      size="x-small"
      class="mt-1"
      @click="$emit('revert-edit')"
    >
      Revert quick edit
    </v-btn>

    <v-alert
      v-if="toast.show"
      :type="toast.color === 'error' ? 'error' : 'success'"
      variant="tonal"
      density="compact"
      class="mt-2"
    >
      {{ toast.text }}
    </v-alert>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  file: { type: Object, default: null },
  imageRotation: { type: Number, default: 0 },
  imageCropMode: { type: Boolean, default: false },
  hasImageCropSelection: { type: Boolean, default: false },
  thumbnailPending: { type: Boolean, default: false },
  textEditMode: { type: Boolean, default: false },
  supportsTextEditing: { type: Boolean, default: false },
  toast: { type: Object, default: () => ({ show: false, text: '', color: 'success' }) }
})

defineEmits(['save-edit', 'revert-edit', 'rotate-left', 'rotate-right', 'start-edit', 'cancel-edit', 'start-crop', 'clear-crop', 'cancel-crop'])

const isImage = computed(() => {
  return props.file && (props.file.type === 'image' || props.file['@type'] === 'Image')
})

const isEditable = computed(() => {
  if (!props.file) return false
  const t = props.file.type
  return ['text', 'csv', 'html', 'json'].includes(t) || t?.endsWith('.json')
})

const isReference = computed(() => {
  if (!props.file) return false
  return Boolean(props.file.ref || props.file.ref_rid)
})

const hasPendingRotation = computed(() => {
  const degrees = Number(props.imageRotation || 0)
  return Number.isFinite(degrees) && (Math.abs(degrees) % 360) !== 0
})

const hasPendingImageEdit = computed(() => {
  return hasPendingRotation.value || Boolean(props.hasImageCropSelection)
})

const showVersion = computed(() => {
  return isImage.value || isEditable.value || (props.file && props.file.edited)
})
</script>
