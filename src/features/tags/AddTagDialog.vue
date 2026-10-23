<script setup>
import { computed, reactive, watch } from 'vue'
import { createEntity, getEntityTypes } from '@/api/entities.js'
import { getProjects } from '@/api/projects.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { defaultType } from './tagAdmin.js'

// Creates a manual tag of a chosen type (always one; 'Tag' to start with) in a desk: the given `deskRid`, or, without one (the
// global Tags view), a desk the user picks.
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ deskRid: { type: String, default: '' } })
const emit = defineEmits(['created'])

const state = reactive({
  types: [],
  desks: [],
  desk: '',
  type: null,
  label: '',
  pending: false,
  error: null,
})

const ready = computed(() => Boolean(state.desk && state.type && state.label.trim()))

watch(open, async (isOpen) => {
  if (!isOpen) return
  Object.assign(state, { desk: props.deskRid, type: null, label: '', pending: false, error: null })
  try {
    state.types = (await getEntityTypes()) || []
    state.type = defaultType(state.types)
    if (!props.deskRid) {
      state.desks = (await getProjects()).map((p) => ({ value: p['@rid'], title: p.label }))
    }
  } catch (error) {
    state.error = error
  }
})

async function submit() {
  if (!ready.value) return
  state.pending = true
  state.error = null
  try {
    await createEntity(state.type, state.label.trim(), state.desk)
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
            v-if="!deskRid"
            v-model="state.desk"
            :items="state.desks"
            label="Desk"
            hint="A tag belongs to one desk; it can be shared with other desks later."
            persistent-hint
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-select
            v-model="state.type"
            :items="state.types"
            item-title="label"
            item-value="type"
            label="Tag type"
            :clearable="false"
            variant="outlined"
            density="comfortable"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item
                v-bind="itemProps"
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
          <v-btn
            type="submit"
            color="primary"
            variant="flat"
            :loading="state.pending"
            :disabled="!ready"
            >Create tag</v-btn
          >
        </v-card-actions>
      </form>
    </v-card>
  </v-dialog>
</template>
