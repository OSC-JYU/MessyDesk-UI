<script setup>
import { reactive, watch } from 'vue'
import { getSetEntities } from '@/api/entities.js'
import { createFilter } from '@/api/services.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// The tag filter makes a new set of references to the files of a set that
// have (or lack) chosen tags.
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  filterId: { type: String, required: true },
  setRid: { type: String, required: true },
})

const emit = defineEmits(['created'])

const MODES = [
  { value: 'include', title: 'Include tags (files with the selected tags)' },
  { value: 'exclude', title: 'Exclude tags (files without the selected tags)' },
  { value: 'untagged', title: 'No tags (files with no tags at all)' },
]

const state = reactive({
  tags: [],
  mode: 'include',
  selected: [],
  match: 'or',
  label: '',
  pending: false,
  error: null,
})

async function loadTags() {
  const rows = await getSetEntities(props.setRid)
  state.tags = (rows || [])
    .filter((row) => row?.['@rid'] || row?.rid)
    .map((row) => {
      const raw = String(row['@rid'] || row.rid)
      const rid = raw.startsWith('#') ? raw : `#${raw}`
      return {
        value: rid,
        title: `${row.label || rid} (${row.type || 'entity'}, ${Number(row.count || 0)})`,
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title))
  if (!state.tags.length) state.error = 'This set has no tags yet.'
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  Object.assign(state, {
    mode: 'include',
    selected: [],
    match: 'or',
    label: '',
    pending: false,
    error: null,
  })
  try {
    await loadTags()
  } catch (error) {
    state.error = error
  }
})

async function submit() {
  if (state.mode !== 'untagged' && !state.selected.length) {
    state.error = 'Select at least one tag.'
    return
  }
  const payload = {
    selection_mode: state.mode,
    selected_entity_rids: state.mode === 'untagged' ? [] : state.selected,
    match: state.mode === 'include' ? state.match : 'or',
  }
  if (state.label.trim()) payload.set_label = state.label.trim()
  state.pending = true
  state.error = null
  try {
    await createFilter(props.filterId, props.setRid, payload)
    open.value = false
    emit('created')
  } catch (error) {
    state.error = error
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="640" :persistent="state.pending">
    <v-card rounded="lg" title="Create a tag filter set">
      <v-card-text>
        <p class="tag-filter__intro">
          A new set is made with references to the matching files; the files themselves are not
          copied.
        </p>
        <v-select
          v-model="state.mode"
          :items="MODES"
          label="Filter"
          variant="outlined"
          density="comfortable"
        />
        <v-autocomplete
          v-if="state.mode !== 'untagged'"
          v-model="state.selected"
          :items="state.tags"
          label="Tags"
          multiple
          chips
          closable-chips
          clearable
          variant="outlined"
          density="comfortable"
        />
        <v-radio-group
          v-if="state.mode === 'include'"
          v-model="state.match"
          inline
          label="Files must have"
        >
          <v-radio label="any selected tag" value="or" />
          <v-radio label="all selected tags" value="and" />
        </v-radio-group>
        <v-text-field
          v-model="state.label"
          label="Name of the new set (optional)"
          variant="outlined"
          density="comfortable"
        />
        <ErrorAlert :error="state.error" title="Could not create the filter" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="state.pending" @click="open = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="state.pending" @click="submit"
          >Create filter</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.tag-filter__intro {
  margin: 0 0 var(--md-space-4);
  color: var(--md-color-text-muted);
}
</style>
