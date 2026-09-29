<script setup>
import { computed } from 'vue'

// Small coloured chip for a job, service or process status. Known statuses
// get a fixed colour and icon so a status looks the same on every screen.
const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, default: '' },
})

const STATUSES = {
  running: { color: 'info', icon: 'mdi-progress-clock', label: 'Running' },
  processing: { color: 'info', icon: 'mdi-progress-clock', label: 'Processing' },
  queued: { color: 'secondary', icon: 'mdi-tray-full', label: 'Queued' },
  pausing: { color: 'warning', icon: 'mdi-pause', label: 'Pausing' },
  paused: { color: 'warning', icon: 'mdi-pause', label: 'Paused' },
  resuming: { color: 'info', icon: 'mdi-play', label: 'Resuming' },
  cancelling: { color: 'warning', icon: 'mdi-close', label: 'Cancelling' },
  cancelled: { color: 'default', icon: 'mdi-close-circle-outline', label: 'Cancelled' },
  done: { color: 'success', icon: 'mdi-check-circle-outline', label: 'Done' },
  finished: { color: 'success', icon: 'mdi-check-circle-outline', label: 'Finished' },
  completed: { color: 'success', icon: 'mdi-check-circle-outline', label: 'Completed' },
  idle: { color: 'default', icon: 'mdi-sleep', label: 'Idle' },
  error: { color: 'error', icon: 'mdi-alert-circle-outline', label: 'Error' },
  failed: { color: 'error', icon: 'mdi-alert-circle-outline', label: 'Failed' },
}

const config = computed(() => {
  const key = String(props.status || '').toLowerCase()
  return (
    STATUSES[key] || {
      color: 'default',
      icon: 'mdi-help-circle-outline',
      label: props.status || 'Unknown',
    }
  )
})
</script>

<template>
  <v-chip
    :color="config.color"
    :prepend-icon="config.icon"
    size="small"
    variant="tonal"
    label
    class="status-chip"
    :data-status="status"
  >
    {{ label || config.label }}
  </v-chip>
</template>

<style scoped>
.status-chip {
  font-weight: var(--md-font-weight-medium);
}
</style>
