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
      text: 'Crunching…',
      spin: true,
    }
  }
  return null
})

const failed = computed(() => Boolean(props.data.error))

// The parameters the run used, saved on the node as JSON ({ params: [{ label, value }], prompt }).
// Only a few rows fit on the card; the rest is in the details.
const MAX_ROWS = 4
const summary = computed(() => {
  try {
    const raw = props.data.params_summary
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) || {}
  } catch {
    return {}
  }
})
const paramRows = computed(() => (summary.value.params || []).slice(0, MAX_ROWS))
const moreParams = computed(() => Math.max(0, (summary.value.params || []).length - MAX_ROWS))
const prompt = computed(() => summary.value.prompt || '')
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
    <dl v-if="paramRows.length" class="process-node__params" aria-label="Parameters">
      <template v-for="row in paramRows" :key="row.name">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
      </template>
      <dd v-if="moreParams" class="process-node__more">+{{ moreParams }} more</dd>
    </dl>
    <p v-if="prompt" class="process-node__prompt" :title="prompt">{{ prompt }}</p>
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
.process-node__params {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0 var(--md-space-2);
  margin: 0 0 var(--md-space-2);
  font-size: var(--md-font-size-sm);
}

.process-node__params dt {
  opacity: 0.75;
}

.process-node__params dd {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.process-node__more {
  grid-column: 1 / -1;
  opacity: 0.75;
}

.process-node__prompt {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 var(--md-space-2);
  font-style: italic;
  opacity: 0.9;
}
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
