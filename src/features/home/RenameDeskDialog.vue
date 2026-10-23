<script setup>
import { reactive, watch } from 'vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'

const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  desk: { type: Object, default: null },
  rename: { type: Function, required: true },
})

const state = reactive({ name: '', pending: false, error: null })

watch(open, (isOpen) => {
  if (isOpen) {
    state.name = props.desk?.name || ''
    state.error = null
  }
})

async function save() {
  const name = state.name.trim()
  if (!name) {
    state.error = 'Please give the desk a name.'
    return
  }
  state.pending = true
  state.error = null
  try {
    await props.rename(props.desk.rid, name)
    open.value = false
  } catch (error) {
    state.error = error
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="480" :persistent="state.pending">
    <v-card rounded="lg" title="Rename desk">
      <form @submit.prevent="save">
        <v-card-text>
          <v-text-field
            v-model="state.name"
            label="Desk name"
            variant="outlined"
            hide-details="auto"
            autofocus
          />
          <ErrorAlert :error="state.error" title="Could not rename the desk" class="mt-4" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="state.pending" @click="open = false">Cancel</v-btn>
          <v-btn type="submit" color="primary" variant="flat" :loading="state.pending">Save</v-btn>
        </v-card-actions>
      </form>
    </v-card>
  </v-dialog>
</template>
