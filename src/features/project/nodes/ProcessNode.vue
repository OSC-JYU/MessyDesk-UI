<script setup>
// Vue Flow passes more props (id, label, position, …) than a node uses;
// they must not fall through onto the frame.
defineOptions({ inheritAttrs: false })
import { computed } from 'vue'
import NodeShell from './NodeShell.vue'
import cookieWhite from '@/assets/images/cookie-bite-solid-white.svg'

// A processing step (process, set process or filter): its service and
// model, and whether it is waiting, running or failed.
const props = defineProps({ data: { type: Object, required: true } })

const status = computed(() => {
  if (props.data.status === 'waiting') return { icon: 'mdi-bed-clock', text: 'Waiting in queue…' }
  if (props.data.status === 'running') {
    return {
      icon: 'mdi-progress-clock',
      text: props.data.role === 'import' ? 'Importing…' : 'Crunching…',
      spin: true,
    }
  }
  return null
})

const failed = computed(() => Boolean(props.data.error))
const errorText = computed(() =>
  props.data.error_count
    ? `Errors: ${props.data.error_count}`
    : typeof props.data.error === 'string' && props.data.error !== 'error'
      ? props.data.error
      : 'Something went wrong',
)
</script>

<template>
  <NodeShell :label="data.label" kind="process">
    <pre v-if="data.description" class="process-node__description">{{ data.description }}</pre>
    <v-alert v-if="failed" type="error" density="compact" variant="flat" class="mb-2">{{
      errorText
    }}</v-alert>
    <div class="process-node__row">
      <p v-if="status" class="process-node__status">
        <v-progress-circular v-if="status.spin" indeterminate size="18" width="2" />
        <v-icon v-else :icon="status.icon" size="18" aria-hidden="true" />
        {{ status.text }}
      </p>
      <img v-else-if="!failed" :src="cookieWhite" alt="" class="process-node__cookie" />
      <div class="process-node__chips">
        <v-chip v-if="data.service" size="x-small" color="primary" variant="flat" label>{{
          data.service
        }}</v-chip>
        <v-chip v-if="data.model" size="x-small" color="warning" variant="flat" label>{{
          data.model
        }}</v-chip>
      </div>
    </div>
  </NodeShell>
</template>

<style scoped>
.process-node__description {
  margin-block-end: var(--md-space-2) !important;
  opacity: 0.9;
}

.process-node__row {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
}

.process-node__status {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  margin: 0;
}

.process-node__cookie {
  width: var(--md-space-7);
}

.process-node__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
}
</style>
