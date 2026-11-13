<script setup>
import { computed } from 'vue'
import BarHeader from '@/ui/BarHeader.vue'
import BreadcrumbTrail from '@/ui/BreadcrumbTrail.vue'
import { browsePosition } from './browseQuery.js'

// The bar above the file, like the bar of the set browser: where the file is (the set, the PDF
// it comes from, the file), previous/next through the set or result list, and close (back to the
// desk). Clicking a step of the path goes back to it.
const props = defineProps({
  context: { type: Object, default: null },
  file: { type: Object, default: null },
})

// `back` gives where to return: { origin } is the PDF to open inside the set.
const emit = defineEmits(['prev', 'next', 'back', 'close'])

const position = computed(() => browsePosition(props.context))
const isSet = computed(() => props.context?.mode === 'set')

const crumbs = computed(() => {
  const items = []
  if (isSet.value) {
    items.push({
      key: 'set',
      label: props.context.set_label || 'Set',
      icon: 'mdi-folder-multiple-outline',
      back: {},
    })
    if (props.file?.origin_label) {
      items.push({
        key: 'origin',
        label: props.file.origin_label,
        icon: 'mdi-file-pdf-box',
        color: 'error',
        back: { origin: props.context.origin_rid ?? props.file.origin_rid },
      })
    }
  } else if (props.context?.mode === 'search') {
    items.push({
      key: 'results',
      label: props.context.query || 'Results',
      icon: props.context.kind === 'tags' ? 'mdi-tag-outline' : 'mdi-magnify',
      back: {},
    })
  }
  items.push({ key: 'file', label: props.file?.label || '…' })
  return items
})

const tags = computed(() =>
  (props.file?.entities || props.file?.tags || [])
    .map((tag) => (typeof tag === 'string' ? { label: tag } : tag))
    .filter((tag) => tag?.label || tag?.name),
)
</script>

<template>
  <BarHeader label="Browse files">
    <BreadcrumbTrail
      :items="crumbs"
      label="Where the file is"
      @select="(item) => emit('back', item.back)"
    />
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
      icon="mdi-close"
      size="small"
      variant="text"
      aria-label="Close file"
      @click="emit('close')"
    />
  </BarHeader>
</template>

<style scoped>
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
