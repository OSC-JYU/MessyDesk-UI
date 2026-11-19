<script setup>
import { computed, reactive, watch } from 'vue'
import { mergeEntities } from '@/api/entities.js'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'

// Merge tags into one: the links of the others (whole files and coded passages) move to the tag
// you keep, and the others are deleted. It cannot be undone, so the effect is shown first.
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ tags: { type: Array, required: true } })
const emit = defineEmits(['merged'])

const state = reactive({ target: '', preview: null, loading: false, pending: false, error: '' })
let token = 0

const sources = computed(() => props.tags.filter((t) => t.rid !== state.target))
const types = computed(() => new Set(props.tags.map((t) => t.type)))
const mixedTypes = computed(() => types.value.size > 1)

function message(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong.'
}

async function loadPreview() {
  const mine = ++token
  state.preview = null
  state.error = ''
  if (!state.target || !sources.value.length || mixedTypes.value) return
  state.loading = true
  try {
    const preview = await mergeEntities(state.target, sources.value.map((t) => t.rid), true)
    if (mine === token) state.preview = preview
  } catch (error) {
    if (mine === token) state.error = message(error)
  } finally {
    if (mine === token) state.loading = false
  }
}

watch(open, (isOpen) => {
  if (!isOpen) return
  // A new target loads the preview through the watcher below; the same one needs a reload here.
  const first = props.tags[0]?.rid || ''
  if (state.target === first) loadPreview()
  else state.target = first
})
watch(() => state.target, () => open.value && loadPreview())

async function confirm() {
  state.pending = true
  state.error = ''
  try {
    await mergeEntities(state.target, sources.value.map((t) => t.rid))
    open.value = false
    emit('merged')
  } catch (error) {
    state.error = message(error)
  } finally {
    state.pending = false
  }
}

const error = computed(() =>
  mixedTypes.value ? 'Only tags of one type can be merged.' : state.error,
)
</script>

<template>
  <ConfirmDialog
    v-model="open"
    title="Merge tags"
    confirm-text="Merge"
    danger
    :loading="state.pending"
    :confirm-disabled="state.loading || !state.preview || mixedTypes"
    :error="error"
    @confirm="confirm"
  >
    <v-radio-group v-model="state.target" label="Keep this tag" density="compact" hide-details>
      <v-radio v-for="tag in tags" :key="tag.rid" :value="tag.rid" :label="tag.label" />
    </v-radio-group>
    <v-progress-linear v-if="state.loading" indeterminate class="mt-3" />
    <div v-else-if="state.preview" class="tag-merge__effect" data-test="merge-effect">
      <p>
        {{ state.preview.sources.map((s) => `"${s.label}"`).join(', ') }}
        will be deleted and merged into "{{ state.preview.target.label }}".
      </p>
      <p>
        {{ state.preview.links }} {{ state.preview.links === 1 ? 'tag link moves' : 'tag links move' }}
        <template v-if="state.preview.duplicates">
          ; {{ state.preview.duplicates }} that the kept tag already has
          {{ state.preview.duplicates === 1 ? 'is' : 'are' }} not doubled
        </template>
        .
      </p>
      <p v-if="state.preview.desks.length">
        The kept tag is added to every desk that had one of the merged tags:
        {{ state.preview.desks.map((d) => d.label).join(', ') }}.
      </p>
      <p><strong>This cannot be undone.</strong></p>
    </div>
  </ConfirmDialog>
</template>

<style scoped>
.tag-merge__effect {
  margin-block-start: var(--md-space-3);
}

.tag-merge__effect p {
  margin: 0 0 var(--md-space-2);
}
</style>
