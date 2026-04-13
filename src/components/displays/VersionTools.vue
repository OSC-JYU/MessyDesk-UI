<template>
  <div v-if="showVersion" class="version-tools">

    <template v-if="file && isImage">
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
      <v-btn color="primary" block size="x-small" class="mt-1" @click="$emit('save-edit')">
        Save edited version
      </v-btn>
    </template>

    <v-btn
      v-if="file && file.edited"
      color="warning"
      block
      size="x-small"
      class="mt-1"
      @click="$emit('revert-edit')"
    >
      Revert to original
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
  toast: { type: Object, default: () => ({ show: false, text: '', color: 'success' }) }
})

defineEmits(['save-edit', 'revert-edit', 'rotate-left', 'rotate-right'])

const isImage = computed(() => {
  return props.file && (props.file.type === 'image' || props.file['@type'] === 'Image')
})

const isEditable = computed(() => {
  if (!props.file) return false
  const t = props.file.type
  return ['text', 'csv', 'html', 'json'].includes(t) || t?.endsWith('.json')
})

const showVersion = computed(() => {
  return isImage.value || isEditable.value || (props.file && props.file.edited)
})
</script>
