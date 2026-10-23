<script setup>
import { computed, watch } from 'vue'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { typeDeleteBlock } from './tagAdmin.js'
import { useTagTypes } from './useTagTypes.js'

// The user's tag types, shared by all their desks: add a type, delete an empty one.
// Colours are theme colour names, like the built-in types use.
const COLORS = [
  { title: 'Default', value: 'blue-grey' },
  ...['blue', 'green', 'orange', 'red', 'purple', 'teal', 'brown', 'pink', 'indigo'].map((c) => ({
    title: c[0].toUpperCase() + c.slice(1),
    value: c,
  })),
]
const open = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['changed'])

const types = useTagTypes(() => emit('changed'))
const { state } = types
const confirm = state.confirm
const confirmError = computed(() => confirm.error?.message || '')

watch(open, (isOpen) => isOpen && types.load(), { immediate: true })
</script>

<template>
  <v-dialog v-model="open" max-width="640" scrollable>
    <v-card rounded="lg" title="Tag types">
      <v-card-text>
        <p class="tag-types__intro">
          Types are shared by all your desks. The count is the number of tags of the type in all
          desks.
        </p>
        <ErrorAlert
          :error="state.error"
          title="Could not load types"
          retryable
          @retry="types.load"
        />
        <v-progress-linear v-if="state.loading" indeterminate class="mb-2" />
        <v-table v-if="state.types.length" density="comfortable">
          <thead>
            <tr>
              <th>Type</th>
              <th class="text-end">Tags (all desks)</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="type in state.types" :key="type.type" data-test="type-row">
              <td>
                <v-chip size="small" label :color="type.color || undefined" variant="flat">
                  {{ type.label || type.type }}
                </v-chip>
              </td>
              <td class="text-end">{{ type.count ?? 0 }}</td>
              <td class="text-end">
                <span v-if="type.protected" class="tag-types__locked" data-test="type-protected">
                  <v-icon icon="mdi-lock-outline" size="small" aria-hidden="true" />
                  <v-tooltip activator="parent" location="top">{{
                    typeDeleteBlock(type)
                  }}</v-tooltip>
                </span>
                <span v-else>
                  <v-btn
                    icon="mdi-delete-outline"
                    size="small"
                    variant="text"
                    color="error"
                    :disabled="Boolean(typeDeleteBlock(type))"
                    :aria-label="`Delete type ${type.label || type.type}`"
                    data-test="type-delete"
                    @click="types.askDelete(type)"
                  />
                  <v-tooltip v-if="typeDeleteBlock(type)" activator="parent" location="top">{{
                    typeDeleteBlock(type)
                  }}</v-tooltip>
                </span>
              </td>
            </tr>
          </tbody>
        </v-table>

        <form class="tag-types__add" @submit.prevent="types.add">
          <v-text-field
            v-model="state.name"
            label="New type"
            hint="1-40 letters, digits, spaces, _ or -"
            persistent-hint
            variant="outlined"
            density="compact"
            maxlength="40"
            :disabled="state.adding"
            class="tag-types__name"
          />
          <v-select
            v-model="state.color"
            :items="COLORS"
            label="Colour"
            variant="outlined"
            density="compact"
            :disabled="state.adding"
            class="tag-types__color"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-chip size="x-small" label variant="flat" :color="item.value" class="mr-2" />
                </template>
              </v-list-item>
            </template>
          </v-select>
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            :loading="state.adding"
            :disabled="!state.name.trim()"
            data-test="type-add"
          >
            Add type
          </v-btn>
        </form>
        <ErrorAlert :error="state.addError" title="Could not add the type" class="mt-3" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <ConfirmDialog
    v-model="confirm.open"
    title="Delete tag type"
    :message="`Delete the type &quot;${confirm.type?.label || confirm.type?.type}&quot;? It has no tags.`"
    confirm-text="Delete type"
    danger
    :loading="confirm.pending"
    :error="confirmError"
    @confirm="types.confirmDelete"
  />
</template>

<style scoped>
.tag-types__intro {
  margin: 0 0 var(--md-space-4);
  color: var(--md-color-text-muted);
}

.tag-types__add {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--md-space-2);
  margin-block-start: var(--md-space-4);
}

.tag-types__name {
  flex: 1 1 var(--md-card-min-width);
}

.tag-types__color {
  flex: 0 1 var(--md-card-min-width);
}

.tag-types__locked {
  display: inline-block;
  padding: var(--md-space-2);
  color: var(--md-color-text-muted);
}
</style>
