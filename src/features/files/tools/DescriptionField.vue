<script setup>
import { ref, watch } from 'vue'
import { setNodeAttribute } from '@/api/projects.js'

// The description of a file, edited in place.
const props = defineProps({
  rid: { type: String, required: true },
  description: { type: String, default: '' },
})

const text = ref(props.description || '')
const draft = ref('')
const editing = ref(false)
const saving = ref(false)
const error = ref('')

watch(
  () => [props.rid, props.description],
  () => {
    text.value = props.description || ''
    editing.value = false
  },
)

function edit() {
  draft.value = text.value
  editing.value = true
  error.value = ''
}

async function save() {
  saving.value = true
  try {
    await setNodeAttribute(props.rid, { key: 'description', value: draft.value })
    text.value = draft.value
    editing.value = false
  } catch (e) {
    error.value = e?.message || 'Could not save the description.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="description">
    <template v-if="editing">
      <v-textarea
        v-model="draft"
        label="Description"
        variant="outlined"
        density="compact"
        auto-grow
        rows="2"
        hide-details
        autofocus
      />
      <p v-if="error" class="description__error">{{ error }}</p>
      <div class="description__actions">
        <v-btn size="small" variant="text" @click="editing = false">Cancel</v-btn>
        <v-btn size="small" color="primary" variant="flat" :loading="saving" @click="save"
          >Save</v-btn
        >
      </div>
    </template>
    <button
      v-else
      type="button"
      class="description__text"
      :class="{ 'description__text--empty': !text.trim() }"
      @click="edit"
    >
      {{ text.trim() ? text : 'Add a description' }}
    </button>
  </div>
</template>

<style scoped>
.description__text {
  display: block;
  width: 100%;
  padding: var(--md-space-2);
  border: 1px dashed transparent;
  border-radius: var(--md-radius-sm);
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  white-space: pre-wrap;
  cursor: text;
}

.description__text:hover,
.description__text--empty {
  border-color: var(--md-color-border);
}

.description__text--empty {
  color: var(--md-color-text-muted);
  font-style: italic;
}

.description__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--md-space-1);
  margin-block-start: var(--md-space-1);
}

.description__error {
  margin: var(--md-space-1) 0 0;
  color: var(--md-color-error);
  font-size: var(--md-font-size-xs);
}
</style>
