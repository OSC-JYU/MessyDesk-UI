<script setup>
import { toRef, watch } from 'vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { useTagImport } from './useTagImport.js'

// Adds tags of another desk to this one. The tags are shared: renaming one changes it in both.
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ deskRid: { type: String, required: true } })
const emit = defineEmits(['imported'])

const imp = useTagImport(toRef(props, 'deskRid'), () => emit('imported'))
const { state } = imp

watch(open, (isOpen) => isOpen && imp.reset(), { immediate: true })
</script>

<template>
  <v-dialog v-model="open" max-width="640" scrollable :persistent="state.pending">
    <v-card rounded="lg" title="Import tags from another desk">
      <v-card-text>
        <v-select
          v-model="state.from"
          :items="state.desks"
          label="Desk to import from"
          variant="outlined"
          density="comfortable"
          hide-details
          class="mb-3"
        />
        <template v-if="state.from">
          <v-text-field
            v-model="state.search"
            label="Search tags"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            class="mb-2"
          />
          <p v-if="!state.loading && !state.items.length" class="import__muted">
            {{ state.search ? 'No tags match.' : 'This desk has no tags.' }}
          </p>
          <v-list density="compact" class="import__list">
            <v-list-item
              v-for="tag in state.items"
              :key="tag.rid"
              :disabled="imp.hasTag(tag)"
              :title="tag.label"
              :subtitle="imp.hasTag(tag) ? 'Already in this desk' : tag.type"
              @click="imp.toggle(tag)"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="imp.hasTag(tag) || state.selected.includes(tag.rid)"
                  :disabled="imp.hasTag(tag)"
                  tabindex="-1"
                />
              </template>
            </v-list-item>
          </v-list>
          <v-progress-linear v-if="state.loading" indeterminate class="mt-2" />
          <v-btn
            v-else-if="state.items.length < state.total"
            size="small"
            variant="text"
            data-test="import-more"
            @click="imp.load(true)"
          >
            Show more ({{ state.total - state.items.length }} left)
          </v-btn>
        </template>

        <v-alert v-if="state.result" type="success" variant="tonal" density="compact" class="mt-3">
          Imported {{ state.result.imported }}, already in this desk {{ state.result.skipped }}.
          <template v-if="state.result.conflicts?.length">
            Not imported because this desk has a different tag with the same name:
            {{ state.result.conflicts.map((c) => c.label).join(', ') }}.
          </template>
        </v-alert>
        <ErrorAlert :error="state.error" title="Could not import tags" class="mt-3" />
      </v-card-text>
      <v-card-actions>
        <v-btn
          variant="text"
          :disabled="!state.from || state.pending"
          data-test="import-all"
          @click="imp.importAll"
        >
          Import all
        </v-btn>
        <v-spacer />
        <v-btn variant="text" :disabled="state.pending" @click="open = false">Close</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!state.selected.length"
          :loading="state.pending"
          data-test="import-selected"
          @click="imp.importSelected"
        >
          Import selected ({{ state.selected.length }})
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.import__list {
  max-height: 40vh;
  overflow-y: auto;
}

.import__muted {
  margin: 0;
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-xs);
}
</style>
