<script setup>
import { computed, reactive, watch } from 'vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// Shows a prompt, and edits or creates one. `prompt` is the prompt to show
// (null for a new one of `newType`); `save` stores the edited copy.
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  prompt: { type: Object, default: null },
  newType: { type: String, default: 'text' },
  save: { type: Function, required: true },
})

const state = reactive({ editing: false, draft: null, pending: false, error: null })

const TYPE_ICONS = { image: 'mdi-image-outline', text: 'mdi-text' }

watch(open, (isOpen) => {
  if (!isOpen) return
  state.error = null
  state.pending = false
  state.editing = !props.prompt
  state.draft = props.prompt
    ? structuredClone({ ...props.prompt })
    : {
        type: props.newType,
        name: '',
        description: '',
        content: '',
        output_type: 'text',
        json_schema: '',
      }
})

const shown = computed(() => (state.editing ? state.draft : props.prompt) || {})
const isJson = computed(() => shown.value.output_type === 'json')
const canEdit = computed(() => props.prompt && props.prompt.owner !== 'public')
const canSave = computed(() => {
  const d = state.draft || {}
  return d.name?.trim() && d.content?.trim() && (d.output_type !== 'json' || d.json_schema?.trim())
})

function startEditing() {
  state.draft = structuredClone({ ...props.prompt })
  state.editing = true
}

function cancel() {
  if (props.prompt) state.editing = false
  else open.value = false
}

async function submit() {
  state.pending = true
  state.error = null
  try {
    await props.save(state.draft)
    open.value = false
  } catch (error) {
    state.error = error
  } finally {
    state.pending = false
  }
}
</script>

<template>
  <v-dialog v-model="open" max-width="860" scrollable :persistent="state.editing">
    <v-card v-if="state.draft" rounded="lg">
      <v-card-item class="prompt-dialog__head">
        <template #prepend>
          <v-icon :icon="TYPE_ICONS[shown.type] || 'mdi-code-json'" aria-hidden="true" />
        </template>
        <v-card-title>
          {{ prompt ? (state.editing ? 'Edit prompt' : shown.name) : 'New prompt' }}
        </v-card-title>
        <v-card-subtitle>
          {{ shown.type === 'image' ? 'Image to text' : 'Text to text' }}
        </v-card-subtitle>
        <template v-if="prompt?.owner" #append>
          <v-chip
            size="small"
            :color="prompt.owner === 'public' ? 'success' : 'primary'"
            variant="tonal"
            label
          >
            {{ prompt.owner }}
          </v-chip>
        </template>
      </v-card-item>

      <v-card-text>
        <template v-if="state.editing">
          <v-text-field
            v-model="state.draft.name"
            label="Name"
            variant="outlined"
            density="comfortable"
          />
          <v-textarea
            v-model="state.draft.content"
            label="Prompt"
            variant="outlined"
            rows="6"
            auto-grow
            class="prompt-dialog__code"
          />
          <v-textarea
            v-model="state.draft.description"
            label="Description"
            variant="outlined"
            rows="2"
            auto-grow
          />
          <v-switch
            v-model="state.draft.output_type"
            true-value="json"
            false-value="text"
            color="primary"
            label="JSON output"
            hide-details
            inset
          />
        </template>
        <template v-else>
          <h3 class="prompt-dialog__label">Prompt</h3>
          <pre class="prompt-dialog__content">{{ shown.content }}</pre>
          <template v-if="shown.description">
            <h3 class="prompt-dialog__label">Description</h3>
            <p>{{ shown.description }}</p>
          </template>
          <v-chip :color="isJson ? 'warning' : 'success'" size="small" variant="tonal" label>
            {{ isJson ? 'JSON output' : 'Text output' }}
          </v-chip>
        </template>

        <template v-if="isJson">
          <v-alert type="info" variant="tonal" density="compact" class="my-4">
            The model is asked to return structured JSON, which is easy for other tools to read. For
            example:
            <pre class="prompt-dialog__content">
{ "books": [{ "title": "String", "year": "Integer", "authors": ["String"] }] }</pre>
            Not all models support JSON output.
          </v-alert>
          <v-textarea
            v-if="state.editing"
            v-model="state.draft.json_schema"
            label="JSON schema"
            hint="Required for JSON output"
            persistent-hint
            variant="outlined"
            rows="6"
            auto-grow
            class="prompt-dialog__code"
          />
          <template v-else>
            <h3 class="prompt-dialog__label">JSON schema</h3>
            <pre v-if="shown.json_schema" class="prompt-dialog__content">{{
              shown.json_schema
            }}</pre>
            <p v-else class="prompt-dialog__muted">No JSON schema defined.</p>
          </template>
        </template>

        <ErrorAlert :error="state.error" title="Could not save the prompt" class="mt-4" />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <template v-if="state.editing">
          <v-btn variant="text" :disabled="state.pending" @click="cancel">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :disabled="!canSave"
            :loading="state.pending"
            @click="submit"
          >
            Save
          </v-btn>
        </template>
        <template v-else>
          <v-btn v-if="canEdit" variant="text" prepend-icon="mdi-pencil" @click="startEditing"
            >Edit</v-btn
          >
          <v-btn color="primary" variant="flat" @click="open = false">Close</v-btn>
        </template>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.prompt-dialog__head {
  border-bottom: 1px solid var(--md-color-border);
}

.prompt-dialog__label {
  margin: var(--md-space-4) 0 var(--md-space-1);
  font-family: var(--md-font-body) !important;
  font-size: var(--md-font-size-sm);
  font-weight: var(--md-font-weight-bold);
}

.prompt-dialog__content {
  margin: var(--md-space-2) 0;
  padding: var(--md-space-3);
  border-radius: var(--md-radius-md);
  background: var(--md-color-bg);
  font-size: var(--md-font-size-sm);
}

.prompt-dialog__code :deep(textarea) {
  font-family: var(--md-font-mono);
}

.prompt-dialog__muted {
  color: var(--md-color-text-muted);
}
</style>
