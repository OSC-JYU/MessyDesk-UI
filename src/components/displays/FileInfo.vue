<template>
  <div class="file-info">
    <div v-if="file" class="mb-3">
      <h4 class="text-subtitle-2 mb-2">{{ file.label }}</h4>
      <v-chip v-if="file.edited" color="orange-darken-2" size="x-small" class="mb-2">Edited version</v-chip>
      <DescriptionEditor :description="file.description" :rid="file['@rid']"/>

      <div v-if="file.metadata" class="mt-2">
        <div v-if="file.metadata.size" class="text-caption text-grey">
          Size: {{ file.metadata.size }} MB
        </div>
        <div v-if="file.metadata.width" class="text-caption text-grey">
          {{ file.metadata.width }} × {{ file.metadata.height }} px
        </div>
        <div v-if="file.metadata.lines" class="text-caption text-grey">
          {{ file.metadata.lines }} lines, {{ file.metadata.characters }} chars
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="mt-3">
      <v-btn
        v-if="file"
        color="primary"
        class="mb-2"
        block
        size="x-small"
        :href="apiUrl + '/api/files/' + file['@rid'].replace('#','')"
        target="_blank"
      >
        <v-icon start size="small">mdi-open-in-new</v-icon>
        Open file
      </v-btn>
      
      <v-btn
        color="secondary"
        block
        size="x-small"
        @click="$emit('refresh')"
      >
        <v-icon start size="small">mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import DescriptionEditor from './DescriptionEditor.vue'

const apiUrl = import.meta.env.VITE_API_PATH

defineProps({
  file: { type: Object, default: null }
})

defineEmits(['refresh'])
</script>
