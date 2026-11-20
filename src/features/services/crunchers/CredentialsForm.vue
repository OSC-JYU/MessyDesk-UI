<script setup>
// The several credentials a service needs for one run. The values live in this model only: the
// parent keeps them in memory while the panel is open and sends them encoded in a header when the
// run starts.
const model = defineModel({ type: Object, default: () => ({}) })

defineProps({
  fields: { type: Array, default: () => [] },
  errors: { type: Object, default: () => ({}) },
  serviceName: { type: String, default: 'the service' },
})

function update(name, value) {
  model.value = { ...model.value, [name]: value }
}
</script>

<template>
  <div class="credentials-form" data-test="credentials-form">
    <p class="credentials-form__title">Your credentials for {{ serviceName }}</p>
    <v-text-field
      v-for="field in fields"
      :key="field.name"
      :model-value="model[field.name] ?? ''"
      :type="field.secret ? 'password' : 'text'"
      :label="field.required ? `${field.label} *` : field.label"
      :placeholder="field.placeholder"
      variant="outlined"
      density="compact"
      autocomplete="off"
      spellcheck="false"
      :error-messages="errors[field.name] || undefined"
      :hint="field.help"
      :persistent-hint="Boolean(field.help)"
      :data-test="`credential-${field.name}`"
      @update:model-value="update(field.name, $event)"
    />
    <p class="credentials-form__note">
      Used for this run only: the values are kept in MessyDesk's memory while the run lasts and
      never saved to a file, a log or your browser.
    </p>
  </div>
</template>

<style scoped>
.credentials-form {
  margin-block-end: var(--md-space-4);
}

.credentials-form__title {
  margin: 0 0 var(--md-space-2);
  font-weight: var(--md-font-weight-medium);
}

.credentials-form__note {
  margin: 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
