<script setup>
import { reactive, watch } from 'vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// Installs a service from a Nomad spec, an external URL or a local dev URL.
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  install: { type: Function, required: true },
})

const emptyForm = () => ({
  kind: 'nomad',
  id: '',
  name: '',
  description: '',
  nomad_hcl: '',
  url: '',
  dev_url: '',
  service_json: '',
})

const state = reactive({ form: emptyForm(), pending: false, error: null })

watch(open, (isOpen) => {
  if (isOpen) Object.assign(state, { form: emptyForm(), pending: false, error: null })
})

async function readFileInto(files, field) {
  const file = Array.isArray(files) ? files[0] : files
  if (file) state.form[field] = await file.text()
}

function payload() {
  const form = state.form
  const data = { kind: form.kind, id: form.id.trim() }
  if (form.name.trim()) data.name = form.name.trim()
  if (form.description.trim()) data.description = form.description.trim()
  if (form.service_json.trim()) data.service = form.service_json.trim()
  if (form.kind === 'nomad') data.nomad_hcl = form.nomad_hcl
  if (form.kind === 'external') data.url = form.url.trim()
  if (form.kind === 'local') data.dev_url = form.dev_url.trim()
  return data
}

async function submit() {
  if (!state.form.id.trim()) {
    state.error = 'Give the service an id.'
    return
  }
  state.pending = true
  state.error = null
  try {
    await props.install(payload())
    open.value = false
  } catch (error) {
    state.error = error
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="760" scrollable :persistent="state.pending">
    <v-card rounded="lg" title="Install service">
      <v-card-text>
        <v-tabs v-model="state.form.kind" color="primary" class="mb-4">
          <v-tab value="nomad">Nomad</v-tab>
          <v-tab value="external">External URL</v-tab>
          <v-tab value="local">Local URL</v-tab>
        </v-tabs>

        <v-text-field
          v-model="state.form.id"
          label="Service id (queue topic)"
          hint="For example md-trocr"
          persistent-hint
          variant="outlined"
          density="compact"
          class="mb-3"
        />
        <v-text-field
          v-model="state.form.name"
          label="Display name (optional)"
          variant="outlined"
          density="compact"
        />
        <v-textarea
          v-model="state.form.description"
          label="Description (optional)"
          variant="outlined"
          density="compact"
          rows="2"
        />

        <template v-if="state.form.kind === 'nomad'">
          <p class="install__hint">
            Paste a nomad.hcl spec or upload a file. MessyDesk deploys it through Nomad.
          </p>
          <v-file-input
            label="Upload nomad.hcl"
            accept=".hcl,.nomad,text/plain"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-file-upload-outline"
            @update:model-value="(files) => readFileInto(files, 'nomad_hcl')"
          />
          <v-textarea
            v-model="state.form.nomad_hcl"
            label="nomad.hcl"
            class="install__code"
            variant="outlined"
            density="compact"
            rows="8"
          />
        </template>

        <template v-else>
          <p class="install__hint">
            <template v-if="state.form.kind === 'external'">
              An external service reachable over HTTP. Give its URL and, optionally, a service.json
              descriptor.
            </template>
            <template v-else>
              A local development service. Give the DEV_URL where it is running.
            </template>
          </p>
          <v-text-field
            v-if="state.form.kind === 'external'"
            v-model="state.form.url"
            label="Service URL"
            placeholder="https://example.org/service"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            v-else
            v-model="state.form.dev_url"
            label="DEV_URL"
            placeholder="http://localhost:9012"
            variant="outlined"
            density="compact"
          />
          <v-file-input
            label="Upload service.json (optional)"
            accept=".json,application/json"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-file-upload-outline"
            @update:model-value="(files) => readFileInto(files, 'service_json')"
          />
          <v-textarea
            v-model="state.form.service_json"
            label="service.json (optional)"
            class="install__code"
            variant="outlined"
            density="compact"
            rows="6"
          />
        </template>

        <ErrorAlert :error="state.error" title="Could not install the service" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="state.pending" @click="open = false">Cancel</v-btn>
        <v-btn color="primary" variant="flat" :loading="state.pending" @click="submit"
          >Install</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.install__hint {
  margin: 0 0 var(--md-space-2);
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.install__code :deep(textarea) {
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-xs);
}
</style>
