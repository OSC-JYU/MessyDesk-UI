<script setup>
import { reactive } from 'vue'
import { createCodingSets, getUserNames } from '@/api/coding.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// Makes one ROI set per chosen coder on this text or set of texts, each given to its coder. The
// ROI sets appear on the desk after a refresh.
const props = defineProps({ sourceRid: { type: String, required: true } })

const state = reactive({ open: false, users: [], picked: [], label: '', pending: false, done: '', error: null })

async function begin() {
  Object.assign(state, { open: true, picked: [], label: '', done: '', error: null })
  try {
    state.users = (await getUserNames()).map((u) => ({ value: u.rid, title: u.name }))
  } catch (error) {
    state.error = error
  }
}

async function submit() {
  state.pending = true
  state.error = null
  try {
    const made = await createCodingSets(props.sourceRid, state.picked, state.label || undefined)
    state.done = `Made ${made.length} ${made.length === 1 ? 'set' : 'sets'}. Reload the desk to see them.`
  } catch (error) {
    state.error = error
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <v-btn size="small" variant="tonal" prepend-icon="mdi-account-multiple-plus-outline" class="mt-3" @click="begin">
    Code with others
  </v-btn>
  <v-dialog v-model="state.open" max-width="520">
    <v-card rounded="lg" title="Code with others">
      <v-card-text>
        <p class="mb-3">
          One set of passages is made for each person you choose. Each person sees only their own
          set and the texts in it.
        </p>
        <v-autocomplete
          v-model="state.picked"
          :items="state.users"
          label="Coders"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="comfortable"
        />
        <v-text-field
          v-model="state.label"
          label="Name of the sets (optional)"
          hint="The coder's name is added."
          variant="outlined"
          density="comfortable"
        />
        <ErrorAlert :error="state.error" title="Could not make the sets" />
        <p v-if="state.done" role="status">{{ state.done }}</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="state.open = false">Close</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="state.pending"
          :disabled="!state.picked.length || Boolean(state.done)"
          @click="submit"
        >
          Make sets
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
