<script setup>
import { computed, onMounted, ref } from 'vue'
import { createTag, getTags } from '@/api/entities.js'

// Parameter input for taggers: either free-text categories or existing tags.
// With tags picked, the value is [{ label, description }] and the cruncher
// only links back those tags.
const model = defineModel({ type: [String, Array], default: '' })

const mode = ref(Array.isArray(model.value) ? 'tags' : 'text')
const text = ref(typeof model.value === 'string' ? model.value : '')
const selected = ref([])
const tags = ref([])
const draft = ref({ label: '', description: '' })
const creating = ref(false)

const options = computed(() =>
  tags.value.map((tag) => ({ value: tag.rid, title: tag.label, subtitle: tag.description })),
)

async function loadTags() {
  const response = await getTags()
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

async function addTag() {
  const label = draft.value.label.trim()
  if (!label) return
  creating.value = true
  try {
    await createTag(label, draft.value.description.trim())
    await loadTags()
    const created = tags.value.find((tag) => tag.label === label)
    if (created && !selected.value.includes(created.rid)) selected.value.push(created.rid)
    emitTags()
    draft.value = { label: '', description: '' }
  } finally {
    creating.value = false
  }
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
      <v-expansion-panels variant="accordion">
        <v-expansion-panel title="Define a new tag">
          <v-expansion-panel-text>
            <v-text-field
              v-model="draft.label"
              label="Label"
              density="compact"
              variant="outlined"
            />
            <v-text-field
              v-model="draft.description"
              label="Description (optional)"
              density="compact"
              variant="outlined"
            />
            <v-btn size="small" variant="tonal" :loading="creating" @click="addTag"
              >Create and select</v-btn
            >
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>
  </div>
</template>
