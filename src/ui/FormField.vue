<script setup>
import { computed, useId } from 'vue'

// Label, hint and error around any form control, so every form lays out and
// reads the same. The control goes in the default slot and receives `id`,
// `describedby` and `invalid` to wire up accessibility.
const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  id: { type: String, default: '' },
})

const generatedId = useId()
const fieldId = computed(() => props.id || `field-${generatedId}`)
const messageId = computed(() => `${fieldId.value}-message`)
const message = computed(() => props.error || props.hint)
</script>

<template>
  <div class="form-field" :class="{ 'form-field--invalid': error }">
    <label :for="fieldId" class="form-field__label">
      {{ label }}
      <span v-if="required" class="form-field__required" aria-hidden="true">*</span>
    </label>
    <slot :id="fieldId" :describedby="message ? messageId : undefined" :invalid="Boolean(error)" />
    <p
      v-if="message"
      :id="messageId"
      class="form-field__message"
      :role="error ? 'alert' : undefined"
    >
      {{ message }}
    </p>
  </div>
</template>

<style scoped>
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-1);
  margin-block-end: var(--md-space-4);
}

.form-field__label {
  font-size: var(--md-font-size-sm);
  font-weight: var(--md-font-weight-medium);
  color: var(--md-color-text);
}

.form-field__required {
  margin-inline-start: var(--md-space-1);
  color: var(--md-color-error);
}

.form-field__message {
  margin: 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.form-field--invalid .form-field__message {
  color: var(--md-color-error);
}
</style>
