<script setup>
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// Scrolling page for a file display, with loading and error states.
defineProps({
  loading: { type: Boolean, default: false },
  error: { type: [String, Object], default: null },
  flush: { type: Boolean, default: false },
})
</script>

<template>
  <div class="display-frame" :class="{ 'display-frame--flush': flush }">
    <LoadingState v-if="loading" text="Loading the file…" />
    <ErrorAlert v-else-if="error" :error="error" title="Could not load the file" />
    <slot v-else />
  </div>
</template>

<style scoped>
.display-frame {
  height: 100%;
  overflow-y: auto;
  padding: var(--md-space-5) var(--md-space-6);
  background: var(--md-color-surface);
}

.display-frame--flush {
  padding: 0;
  overflow: hidden;
}
</style>
