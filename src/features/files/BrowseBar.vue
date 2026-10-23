<script setup>
import { computed } from 'vue'
import { browsePosition } from './browseQuery.js'

// Bar above the file when it was opened from a set or a result list:
// where it is in the list, previous/next, and the way back.
const props = defineProps({
  context: { type: Object, default: null },
  file: { type: Object, default: null },
})

const emit = defineEmits(['prev', 'next', 'back', 'close'])

const position = computed(() => browsePosition(props.context))
const isSet = computed(() => props.context?.mode === 'set')
const setTitle = computed(
  () => props.context?.set_label || String(props.context?.set_rid || '').replace('#', ''),
)
const tags = computed(() =>
  (props.file?.entities || props.file?.tags || [])
    .map((tag) => (typeof tag === 'string' ? { label: tag } : tag))
    .filter((tag) => tag?.label || tag?.name),
)
</script>

<template>
  <nav class="browse-bar" aria-label="Browse files">
    <span v-if="!position" class="browse-bar__file">{{ file?.label }}</span>
    <v-chip
      v-else-if="isSet"
      prepend-icon="mdi-folder-multiple-outline"
      size="small"
      label
      variant="flat"
      color="secondary"
    >
      {{ setTitle }}
    </v-chip>
    <v-chip
      v-else-if="context?.mode === 'search'"
      :prepend-icon="context.kind === 'tags' ? 'mdi-tag-outline' : 'mdi-magnify'"
      size="small"
      label
      variant="flat"
      color="primary"
    >
      {{ context.query }}
    </v-chip>
    <v-chip v-if="isSet && context.source_label" size="small" label variant="tonal">
      Original: {{ context.source_label }}
    </v-chip>

    <div v-if="position" class="browse-bar__stepper">
      <v-btn
        icon="mdi-chevron-left"
        size="small"
        variant="text"
        aria-label="Previous file"
        :disabled="!position.hasPrev"
        @click="emit('prev')"
      />
      <span class="browse-bar__position">{{ position.index + 1 }} / {{ position.total }}</span>
      <v-btn
        icon="mdi-chevron-right"
        size="small"
        variant="text"
        aria-label="Next file"
        :disabled="!position.hasNext"
        @click="emit('next')"
      />
    </div>

    <div v-if="tags.length" class="browse-bar__tags">
      <v-chip
        v-for="(tag, index) in tags"
        :key="tag['@rid'] || tag.rid || index"
        size="x-small"
        prepend-icon="mdi-tag-outline"
        variant="tonal"
        color="warning"
      >
        {{ tag.label || tag.name }}
      </v-chip>
    </div>

    <v-spacer />
    <v-btn
      v-if="position"
      size="small"
      variant="text"
      prepend-icon="mdi-arrow-left"
      @click="emit('back')"
    >
      {{ isSet ? 'Back to set' : 'Back to results' }}
    </v-btn>
    <v-btn
      icon="mdi-close"
      size="small"
      variant="text"
      aria-label="Close file"
      @click="emit('close')"
    />
  </nav>
</template>

<style scoped>
.browse-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-1) var(--md-space-4);
  border-bottom: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.browse-bar__file {
  font-weight: var(--md-font-weight-medium);
}

.browse-bar__stepper {
  display: flex;
  align-items: center;
}

.browse-bar__position {
  min-width: 5ch;
  text-align: center;
  font-size: var(--md-font-size-sm);
  font-variant-numeric: tabular-nums;
}

.browse-bar__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
}
</style>
