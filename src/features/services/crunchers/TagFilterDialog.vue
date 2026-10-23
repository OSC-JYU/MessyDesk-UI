<script setup>
import { reactive, watch } from 'vue'
import { createFilter } from '@/api/services.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import TagPicker from '@/features/tags/TagPicker.vue'
import { tagFilterPayload } from './tagFilter.js'

// The tag filter makes a new set of references to the files of a set that
// have (or lack) chosen tags.
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  filterId: { type: String, required: true },
  setRid: { type: String, required: true },
  // The set's desk: the picker lists this desk's tags.
  deskRid: { type: String, default: '' },
})

const emit = defineEmits(['created'])

const MODES = [
  { value: 'include', title: 'Include tags (files with the selected tags)' },
  { value: 'exclude', title: 'Exclude tags (files without the selected tags)' },
  { value: 'untagged', title: 'No tags (files with no tags at all)' },
]

const state = reactive({
  mode: 'include',
  tags: [],
  roi: [],
  match: 'or',
  label: '',
  pending: false,
  error: null,
})

watch(open, (isOpen) => {
  if (!isOpen) return
  Object.assign(state, {
    mode: 'include',
    tags: [],
    roi: [],
    match: 'or',
    label: '',
    pending: false,
    error: null,
  })
})

async function submit() {
  if (state.mode !== 'untagged' && !state.tags.length && !state.roi.length) {
    state.error = 'Select at least one tag or label.'
    return
  }
  state.pending = true
  state.error = null
  try {
    await createFilter(props.filterId, props.setRid, tagFilterPayload(state))
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
  <v-dialog v-model="open" max-width="720" scrollable :persistent="state.pending">
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
        <TagPicker
          v-if="state.mode !== 'untagged'"
          v-model:tags="state.tags"
          v-model:roi="state.roi"
          :desk-rid="deskRid"
          class="tag-filter__picker"
        />
        <v-radio-group
          v-if="state.mode === 'include'"
          v-model="state.match"
          inline
          label="Files must have"
        >
          <v-radio label="any selected tag or label" value="or" />
          <v-radio label="all selected tags and labels" value="and" />
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
.tag-filter__picker {
  margin-block-end: var(--md-space-4);
}

.tag-filter__intro {
  margin: 0 0 var(--md-space-4);
  color: var(--md-color-text-muted);
}
</style>
