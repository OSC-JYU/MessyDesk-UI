<script setup>
import { ref, watch } from 'vue'

// Text shown as-is and edited in place on click. `save` stores the new value.
const props = defineProps({
  value: { type: String, default: '' },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  multiline: { type: Boolean, default: false },
  save: { type: Function, required: true },
})

const editing = ref(false)
const draft = ref('')
const saving = ref(false)
const error = ref('')

watch(
  () => props.value,
  () => (editing.value = false),
)

function edit() {
  draft.value = props.value || ''
  error.value = ''
  editing.value = true
}

async function commit() {
  saving.value = true
  try {
    await props.save(draft.value)
    editing.value = false
  } catch (e) {
    error.value = e?.message || 'Could not save.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form v-if="editing" class="editable" @submit.prevent="commit">
    <v-textarea
      v-if="multiline"
      v-model="draft"
      :label="label"
      variant="outlined"
      density="compact"
      auto-grow
      rows="2"
      hide-details
      autofocus
    />
    <v-text-field
      v-else
      v-model="draft"
      :label="label"
      variant="outlined"
      density="compact"
      hide-details
      autofocus
    />
    <p v-if="error" class="editable__error">{{ error }}</p>
    <div class="editable__actions">
      <v-btn size="small" variant="text" @click="editing = false">Cancel</v-btn>
      <v-btn type="submit" size="small" color="primary" variant="flat" :loading="saving"
        >Save</v-btn
      >
    </div>
  </form>
  <button
    v-else
    type="button"
    class="editable__view"
    :class="{ 'editable__view--empty': !value?.trim() }"
    :title="`Edit ${label.toLowerCase()}`"
    @click="edit"
  >
    <slot :value="value">{{ value?.trim() ? value : placeholder }}</slot>
  </button>
</template>

<style scoped>
.editable__view {
  display: block;
  width: 100%;
  padding: var(--md-space-1) var(--md-space-2);
  border: 1px dashed transparent;
  border-radius: var(--md-radius-sm);
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  white-space: pre-wrap;
  cursor: text;
}

.editable__view:hover,
.editable__view--empty {
  border-color: var(--md-color-border);
}

.editable__view--empty {
  color: var(--md-color-text-muted);
  font-style: italic;
}

.editable__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--md-space-1);
  margin-block-start: var(--md-space-1);
}

.editable__error {
  margin: var(--md-space-1) 0 0;
  color: var(--md-color-error);
  font-size: var(--md-font-size-xs);
}
</style>
