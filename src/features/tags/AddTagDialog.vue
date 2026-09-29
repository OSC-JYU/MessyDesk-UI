<script setup>
import { reactive, watch } from 'vue'
import { createEntity, getEntitySchema } from '@/api/entities.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// Creates a manual tag of a chosen type.
const open = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['created'])

const state = reactive({ types: [], type: null, label: '', pending: false, error: null })

watch(open, async (isOpen) => {
  if (!isOpen) return
  Object.assign(state, { type: null, label: '', pending: false, error: null })
  try {
    state.types = (await getEntitySchema()) || []
  } catch (error) {
    state.error = error
  }
})

async function submit() {
  if (!state.type || !state.label.trim()) {
    state.error = 'Choose a type and give the tag a label.'
    return
  }
  state.pending = true
  state.error = null
  try {
    await createEntity(state.type, state.label.trim())
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
  <v-dialog v-model="open" max-width="480" :persistent="state.pending">
    <v-card rounded="lg" title="New tag">
      <form @submit.prevent="submit">
        <v-card-text>
          <v-select
            v-model="state.type"
            :items="state.types"
            item-title="label"
            item-value="type"
            label="Tag type"
            variant="outlined"
            density="comfortable"
          >
            <template #item="{ props, item }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.raw.icon ? `mdi-${item.raw.icon}` : undefined"
              />
            </template>
          </v-select>
          <v-text-field
            v-model="state.label"
            label="Label"
            variant="outlined"
            density="comfortable"
          />
          <ErrorAlert :error="state.error" title="Could not create the tag" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="state.pending" @click="open = false">Cancel</v-btn>
          <v-btn type="submit" color="primary" variant="flat" :loading="state.pending"
            >Create tag</v-btn
          >
        </v-card-actions>
      </form>
    </v-card>
  </v-dialog>
</template>
