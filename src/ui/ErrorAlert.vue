<script setup>
import { computed } from 'vue'

// Error message for a failed load or action. Accepts a string, an Error, or
// the `{ status, message }` objects the API layer rejects with. Renders
// nothing when there is no error. Emits `retry` when `retryable` is set.
const props = defineProps({
  error: { type: [String, Object, Error], default: null },
  title: { type: String, default: 'Something went wrong' },
  retryable: { type: Boolean, default: false },
})

const emit = defineEmits(['retry'])

const message = computed(() => {
  const error = props.error
  if (!error) return ''
  if (typeof error === 'string') return error
  if (error.status === 0) return 'Could not reach the server. Check your connection and try again.'
  return error.message || 'Unknown error'
})
</script>

<template>
  <v-alert v-if="message" type="error" variant="tonal" :title="title" class="error-alert">
    {{ message }}
    <template v-if="retryable" #append>
      <v-btn variant="outlined" color="error" size="small" data-test="retry" @click="emit('retry')">
        Try again
      </v-btn>
    </template>
  </v-alert>
</template>

<style scoped>
.error-alert {
  border-radius: var(--md-radius-md);
}
</style>
