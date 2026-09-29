<script setup>
import { computed } from 'vue'
import { isImage, isReference, isTextLike } from '../fileTypes.js'

// Quick edits: rotate or crop an image, or edit a text file, saved as a
// new version that can be reverted. The viewer does the work.
const props = defineProps({
  file: { type: Object, required: true },
  edit: { type: Object, required: true }, // quick-edit state from useQuickEdit
  canEditText: { type: Boolean, default: false },
})

const emit = defineEmits([
  'rotate',
  'start-crop',
  'clear-crop',
  'cancel-crop',
  'start-text',
  'cancel-text',
  'save',
  'revert',
])

const reference = computed(() => isReference(props.file))
const pendingRotation = computed(() => props.edit.rotation % 360 !== 0)
</script>

<template>
  <div class="quick-edit">
    <v-alert v-if="reference" type="info" variant="tonal" density="compact">
      This file refers to another file, so it cannot be edited here.
    </v-alert>

    <template v-else-if="isImage(file)">
      <div class="quick-edit__row">
        <span>Rotate</span>
        <div>
          <v-btn
            icon="mdi-rotate-left"
            size="x-small"
            variant="tonal"
            aria-label="Rotate left"
            class="me-1"
            @click="emit('rotate', -90)"
          />
          <v-btn
            icon="mdi-rotate-right"
            size="x-small"
            variant="tonal"
            aria-label="Rotate right"
            @click="emit('rotate', 90)"
          />
        </div>
      </div>
      <div class="quick-edit__row">
        <span>Crop</span>
        <v-btn
          v-if="!edit.cropMode"
          size="x-small"
          variant="outlined"
          :disabled="edit.busy || pendingRotation"
          @click="emit('start-crop')"
        >
          Start crop
        </v-btn>
        <div v-else>
          <v-btn
            size="x-small"
            variant="outlined"
            class="me-1"
            :disabled="!edit.hasCrop"
            @click="emit('clear-crop')"
            >Clear</v-btn
          >
          <v-btn size="x-small" variant="outlined" @click="emit('cancel-crop')">Cancel</v-btn>
        </div>
      </div>
      <p v-if="edit.cropMode" class="quick-edit__hint">Draw one rectangle on the image.</p>
      <v-btn
        v-if="pendingRotation || edit.hasCrop"
        color="primary"
        variant="flat"
        size="small"
        block
        :loading="edit.busy"
        @click="emit('save')"
      >
        Save quick edit
      </v-btn>
    </template>

    <template v-else-if="isTextLike(file)">
      <v-btn
        v-if="!edit.textMode"
        color="primary"
        variant="flat"
        size="small"
        block
        :disabled="!canEditText"
        @click="emit('start-text')"
      >
        Edit text
      </v-btn>
      <template v-else>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          block
          :loading="edit.busy"
          @click="emit('save')"
          >Save quick edit</v-btn
        >
        <v-btn variant="text" size="small" block class="mt-1" @click="emit('cancel-text')"
          >Cancel edit</v-btn
        >
      </template>
    </template>

    <v-btn
      v-if="file.edited && !reference"
      color="warning"
      variant="tonal"
      size="small"
      block
      class="mt-2"
      :loading="edit.busy"
      @click="emit('revert')"
    >
      Revert quick edit
    </v-btn>
  </div>
</template>

<style scoped>
.quick-edit__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--md-space-2);
}

.quick-edit__hint {
  margin: 0 0 var(--md-space-2);
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-xs);
}
</style>
