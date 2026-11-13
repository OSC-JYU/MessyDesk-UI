<script setup>
import { computed, ref, watch } from 'vue'
import ApiKeyField from './ApiKeyField.vue'
import CredentialsForm from './CredentialsForm.vue'
import { encodeCredentials } from './credentials.js'

// Asks for the API key again when a paused run is resumed: the key of the first start was dropped
// when the run was paused. Emits `submit` with the key; the key is cleared when the dialog closes.
// With `fields` (credential definitions of the service) it asks for those values instead of one
// key and submits them encoded as one key.
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({
  providerName: { type: String, default: 'the provider' },
  error: { type: String, default: '' },
  fields: { type: Array, default: () => [] },
})
const emit = defineEmits(['submit'])

const apiKey = ref('')
const missing = ref(false)
const credentials = ref({})
const credentialErrors = ref({})
const several = computed(() => props.fields.length > 0)

watch(open, (isOpen) => {
  if (!isOpen) {
    apiKey.value = ''
    missing.value = false
    credentials.value = {}
    credentialErrors.value = {}
  }
})

function submit() {
  if (several.value) {
    const { key, errors } = encodeCredentials(credentials.value, props.fields)
    credentialErrors.value = errors || {}
    if (key) emit('submit', key)
    return
  }
  const key = apiKey.value.trim()
  missing.value = !key
  if (key) emit('submit', key)
}
</script>

<template>
  <v-dialog v-model="open" :max-width="several ? 560 : 480">
    <v-card rounded="lg">
      <v-card-item>
        <v-card-title>{{ several ? 'Credentials needed' : 'API key needed' }}</v-card-title>
      </v-card-item>
      <v-card-text>
        <template v-if="several">
          <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
            {{ error }}
          </v-alert>
          <CredentialsForm
            v-model="credentials"
            :fields="fields"
            :errors="credentialErrors"
            :service-name="providerName"
          />
        </template>
        <template v-else>
          <p class="mb-3">Enter your API key for {{ providerName }} to continue this run.</p>
          <ApiKeyField
            v-model="apiKey"
            :provider-name="providerName"
            :error="error || (missing ? 'Enter your API key' : '')"
            @keyup.enter="submit"
          />
        </template>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="open = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" data-test="api-key-submit" @click="submit">
          Continue
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
