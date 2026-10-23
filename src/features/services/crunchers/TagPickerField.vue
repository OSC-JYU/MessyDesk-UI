<script setup>
import { computed, onMounted, ref } from 'vue'
import { getTags } from '@/api/entities.js'
import { injectDesk } from './deskScope.js'

// Parameter input for taggers: either free-text categories or existing tags.
// With tags picked, the value is [{ label, description }] and the cruncher
// only links back those tags. The tags are the desk's own; they are created in Tag admin.
const model = defineModel({ type: [String, Array], default: '' })

const desk = injectDesk()
const mode = ref(Array.isArray(model.value) ? 'tags' : 'text')
const text = ref(typeof model.value === 'string' ? model.value : '')
const selected = ref([])
const tags = ref([])

const options = computed(() =>
  tags.value.map((tag) => ({ value: tag.rid, title: tag.label, subtitle: tag.description })),
)

async function loadTags() {
  const response = await getTags({ projectRid: desk() })
  tags.value = (response?.result || []).map((tag) => ({
    rid: tag.rid,
    label: tag.label,
    description: tag.description || '',
  }))
}

function emitText() {
  model.value = text.value
}

function emitTags() {
  model.value = selected.value
    .map((rid) => tags.value.find((tag) => tag.rid === rid))
    .filter(Boolean)
    .map(({ label, description }) => ({ label, description }))
}

function switchMode(value) {
  mode.value = value
  if (value === 'text') emitText()
  else emitTags()
}

onMounted(loadTags)
</script>

<template>
  <div>
    <v-btn-toggle
      :model-value="mode"
      mandatory
      density="comfortable"
      variant="outlined"
      divided
      class="mb-3"
      @update:model-value="switchMode"
    >
      <v-btn value="text" size="small">List categories</v-btn>
      <v-btn value="tags" size="small">Pick tags</v-btn>
    </v-btn-toggle>

    <v-text-field
      v-if="mode === 'text'"
      v-model="text"
      label="Categories"
      placeholder="For example person, organization, location"
      variant="outlined"
      density="compact"
      hide-details
      @update:model-value="emitText"
    />
    <template v-else>
      <v-autocomplete
        v-model="selected"
        :items="options"
        label="Existing tags"
        multiple
        chips
        closable-chips
        clearable
        variant="outlined"
        density="compact"
        @update:model-value="emitTags"
      >
        <template #item="{ props, item }">
          <v-list-item v-bind="props" :subtitle="item.raw.subtitle" />
        </template>
      </v-autocomplete>
      <p class="tag-picker__hint">New tags are created in Tag admin on the Tags page.</p>
    </template>
  </div>
</template>

<style scoped>
.tag-picker__hint {
  margin: var(--md-space-2) 0 0;
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-xs);
}
</style>
