<script setup>
// The user's own API key for an external provider. It lives in this field's value only: the
// parent keeps it in memory while the panel is open and sends it in a header when the run starts.
const model = defineModel({ type: String, default: '' })

defineProps({
  providerName: { type: String, default: 'the provider' },
  error: { type: String, default: '' },
})
</script>

<template>
  <div class="api-key">
    <v-text-field
      v-model="model"
      type="password"
      label="Your API key"
      variant="outlined"
      density="compact"
      autocomplete="off"
      spellcheck="false"
      :error-messages="error || undefined"
      :hint="`The key for ${providerName}. Used for this run only: it is kept in MessyDesk's memory while the run lasts and never saved to a file, a log or your browser.`"
      persistent-hint
      data-test="api-key"
    />
  </div>
</template>
