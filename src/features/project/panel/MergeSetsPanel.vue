<script setup>
import { computed, reactive, watch } from 'vue'
import { mergeSets } from '@/api/projects.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { useWorkspace } from '../useWorkspace.js'

// Shown in place of the node panel while sets are picked (shift-click): names the new set and
// merges them. The new set holds references to the files, so nothing is copied and the picked
// sets stay as they are.
const workspace = useWorkspace()
const sets = computed(() => workspace.state.selectedSets)
const form = reactive({ name: '', pending: false, error: null })

const kinds = computed(() => [...new Set(sets.value.flatMap((s) => s.data.types || []))])
const total = computed(() => sets.value.reduce((sum, s) => sum + (Number(s.data.count) || 0), 0))
const problem = computed(() => {
  if (sets.value.length < 2) return 'Shift-click more sets on the desk to merge them with this one.'
  if (kinds.value.length > 1)
    return `The sets have different kinds of files (${kinds.value.join(', ')}). Only sets with the same kind of files can be merged.`
  return ''
})

watch(
  () => sets.value.length,
  () => (form.error = null),
)

function cancel() {
  workspace.select(sets.value[0] || null)
}

async function submit() {
  form.pending = true
  form.error = null
  try {
    const result = await mergeSets(
      sets.value.map((s) => s.id),
      form.name.trim(),
    )
    form.name = ''
    workspace.select(null)
    workspace.reload(result?.output_set?.['@rid'] || null)
  } catch (error) {
    form.error = error
  } finally {
    form.pending = false
  }
}
</script>

<template>
  <aside class="merge-panel" aria-label="Merge sets">
    <h2 class="merge-panel__title">Merge sets</h2>
    <p class="merge-panel__hint">
      A new set is made with references to the files of the picked sets. The files are not copied,
      and a file that is in several of the sets is added once.
    </p>
    <ul class="merge-panel__list">
      <li v-for="set in sets" :key="set.id">
        <v-icon icon="mdi-folder-multiple-outline" size="18" aria-hidden="true" />
        <span class="merge-panel__name">{{ set.data.label }}</span>
        <v-chip size="x-small" label variant="tonal">{{ set.data.count ?? 0 }}</v-chip>
        <v-btn
          icon="mdi-close"
          size="x-small"
          variant="text"
          :aria-label="`Remove ${set.data.label} from the merge`"
          @click="workspace.toggleSet(set)"
        />
      </li>
    </ul>
    <p v-if="sets.length > 1" class="merge-panel__total">Up to {{ total }} files</p>
    <v-alert v-if="problem" type="info" variant="tonal" density="compact" class="mb-3">{{
      problem
    }}</v-alert>
    <ErrorAlert :error="form.error" title="Could not merge the sets" class="mb-3" />
    <v-text-field
      v-model="form.name"
      label="Name of the new set"
      placeholder="Default: the names of the sets"
      variant="outlined"
      density="comfortable"
      hide-details
      class="mb-3"
    />
    <div class="merge-panel__actions">
      <v-btn variant="text" @click="cancel">Cancel</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-set-merge"
        :disabled="Boolean(problem)"
        :loading="form.pending"
        @click="submit"
        >Merge</v-btn
      >
    </div>
  </aside>
</template>

<style scoped>
.merge-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: var(--md-space-5);
  border-inline-start: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.merge-panel__title {
  margin: 0 0 var(--md-space-2);
  font-family: var(--md-font-title);
}

.merge-panel__hint,
.merge-panel__total {
  margin: 0 0 var(--md-space-3);
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-sm);
}

.merge-panel__list {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-1);
  margin: 0 0 var(--md-space-3);
  padding: 0;
  list-style: none;
}

.merge-panel__list li {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
}

.merge-panel__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merge-panel__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--md-space-2);
}
</style>
