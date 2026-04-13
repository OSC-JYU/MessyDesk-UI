<template>
  <div v-if="context && context.mode === 'set'" class="set-tools d-flex align-center pa-2">
    <v-chip v-if="context.set_label" color="teal-darken-2" variant="flat" size="small" class="mr-3">
      {{ context.set_label }}
    </v-chip>

    <v-chip v-if="context.source_label" color="blue-grey-darken-1" variant="flat" size="small" class="mr-3">
      Original: {{ context.source_label }}
    </v-chip>

    <div class="d-flex align-center">
      <v-btn @click="$emit('prev')" :disabled="skip <= 1" color="secondary" size="x-small">
        <v-icon size="small">mdi-chevron-left</v-icon>
      </v-btn>
      <span class="mx-2 text-caption">{{ skip }} / {{ fileCount }}</span>
      <v-btn @click="$emit('next')" :disabled="skip >= fileCount" color="secondary" size="x-small">
        <v-icon size="small">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <v-switch
      v-if="context.source_rid"
      v-model="groupedBoundary"
      density="compact"
      hide-details
      color="primary"
      label="Grouped boundary nav"
      class="ml-4"
      @update:model-value="$emit('toggle-grouped-boundary', $event)"
    ></v-switch>

    <v-spacer />

    <v-btn icon size="x-small" variant="text" @click="$emit('close')">
      <v-icon>mdi-close</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  context: { type: Object, default: null },
  skip: { type: Number, default: 1 },
  fileCount: { type: Number, default: 0 }
})

defineEmits(['prev', 'next', 'close', 'toggle-grouped-boundary'])

const groupedBoundary = ref(true)

watch(() => props.context, (ctx) => {
  if (ctx && ctx.mode === 'set') {
    groupedBoundary.value = Boolean(ctx.source_rid)
  }
}, { immediate: true })
</script>

<style scoped>
.set-tools {
  background: rgba(0, 77, 77, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  min-height: 48px;
}
</style>
