<template>
  <div v-if="context && context.mode === 'set'" class="set-tools d-flex align-center pa-2">
    <div class="d-flex align-center">
      <v-btn @click="$emit('prev')" :disabled="skip <= 1" color="secondary" size="x-small">
        <v-icon size="small">mdi-chevron-left</v-icon>
      </v-btn>
      <span class="white--text mx-2 text-caption">{{ skip }} / {{ fileCount }}</span>
      <v-btn @click="$emit('next')" :disabled="skip >= fileCount" color="secondary" size="x-small">
        <v-icon size="small">mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <v-chip v-if="currentSetTitle" color="teal-darken-2" variant="flat" size="small" class="ml-3 mr-3">
      Set: {{ currentSetTitle }}
    </v-chip>

    <v-chip v-if="context.source_label" color="blue-grey-darken-1" variant="flat" size="small" class="mr-3">
      Original: {{ context.source_label }}
    </v-chip>

    <div v-if="currentFileTags.length" class="d-flex align-center flex-wrap mr-3">
      <v-chip
        v-for="(tag, index) in currentFileTags"
        :key="tag['@rid'] || tag.rid || tag.id || (tag.label || tag.name || tag) + '-' + index"
        size="x-small"
        color="orange-darken-2"
        variant="tonal"
        class="mr-1 mb-1"
      >
        <v-icon start size="12">mdi-tag-outline</v-icon>
        {{ tag.label || tag.name || tag }}
      </v-chip>
    </div>

    <v-spacer />

    <v-btn color="white" variant="tonal" size="x-small" @click="$emit('back-to-set')">
      <v-icon start size="small">mdi-arrow-left</v-icon>
      Back to set
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  context: { type: Object, default: null },
  file: { type: Object, default: null },
  skip: { type: Number, default: 1 },
  fileCount: { type: Number, default: 0 }
})

defineEmits(['prev', 'next', 'back-to-set'])

const currentSetTitle = computed(() => {
  if (!props.context || props.context.mode !== 'set') return ''
  if (props.context.set_label) return props.context.set_label
  if (props.context.setLabel) return props.context.setLabel
  if (props.context.label) return props.context.label
  if (props.context.set?.label) return props.context.set.label
  if (props.context.set_name) return props.context.set_name
  if (props.context.name) return props.context.name
  if (props.context.set_rid) return String(props.context.set_rid).replace('#', '')
  return ''
})

const currentFileTags = computed(() => {
  const file = props.file || {}
  const raw = Array.isArray(file.entities)
    ? file.entities
    : (Array.isArray(file.tags) ? file.tags : [])

  return raw
    .map((tag) => {
      if (typeof tag === 'string') return { label: tag }
      return tag
    })
    .filter((tag) => Boolean(tag && (tag.label || tag.name || tag['@rid'] || tag.rid || tag.id)))
})

</script>

<style scoped>
.set-tools {
  background: rgb(93, 157, 156);
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  min-height: 48px;
}
</style>
