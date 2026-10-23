<script setup>
import { computed, ref, watch } from 'vue'
import { getBatch, getBatchParams } from '@/api/services.js'
import StatusChip from '@/ui/StatusChip.vue'

// What a processing step did: its service, parameters, how long it took and,
// for an LLM job, the prompt. Timing comes from the batch record.
const props = defineProps({ node: { type: Object, required: true } })

const batch = ref(null)
const saved = ref(null)

watch(
  () => props.node.id,
  async (id) => {
    batch.value = null
    saved.value = null
    // A step without a batch record or params.json shows what the node itself has.
    const [record, params] = await Promise.all([
      getBatch(id).catch(() => null),
      getBatchParams(id).catch(() => null),
    ])
    if (id !== props.node.id) return
    batch.value = record
    saved.value = params
  },
  { immediate: true },
)

// What the user sent when starting the run: { id, params, system_params }. The params.json
// is used when the run kept one, otherwise the copy stored on the batch.
const payload = computed(() => {
  if (saved.value) return saved.value
  const raw = batch.value?.task_payload_json
  try {
    return (typeof raw === 'string' ? JSON.parse(raw) : raw) || {}
  } catch {
    return {}
  }
})

const prompt = computed(() => payload.value.system_params?.prompts?.content || '')

const paramRows = computed(() =>
  Object.entries(payload.value.params || {}).filter(([, value]) => value !== '' && value !== null),
)

const status = computed(() => batch.value?.status || props.node.data?.status || '')

const seconds = computed(() => {
  const b = batch.value
  if (!b) return null
  if (b.started_at && b.finished_at) {
    return (new Date(b.finished_at) - new Date(b.started_at)) / 1000
  }
  return b.total_time_sec > 0 ? Number(b.total_time_sec) : null
})

function formatDuration(value) {
  if (!Number.isFinite(value)) return ''
  if (value < 60) return `${Math.round(value * 10) / 10} s`
  const minutes = Math.floor(value / 60)
  const rest = Math.round(value % 60)
  return minutes < 60
    ? `${minutes} min ${rest} s`
    : `${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

const formatTime = (iso) => (iso ? new Date(iso).toLocaleString() : '')

const rows = computed(() => {
  const d = props.node.data || {}
  const b = batch.value || {}
  const list = [
    ['Service', d.service || b.service],
    ['Task', b.task || d.label],
    ['Model', d.model || b.model],
    ['Started', formatTime(b.started_at)],
    ['Finished', formatTime(b.finished_at)],
    ['Execution time', formatDuration(seconds.value)],
  ]
  if (b.total_files) {
    const failed = b.failed_files ? `, ${b.failed_files} failed` : ''
    list.push(['Files', `${b.processed_files || 0} / ${b.total_files}${failed}`])
  }
  return list.filter(([, value]) => value)
})
</script>

<template>
  <section class="process-info" aria-label="Process">
    <div class="process-info__head">
      <h3 class="process-info__title">Process</h3>
      <StatusChip v-if="status" :status="status" />
    </div>
    <dl class="process-info__list">
      <template v-for="[name, value] in rows" :key="name">
        <dt>{{ name }}</dt>
        <dd>{{ value }}</dd>
      </template>
    </dl>
    <template v-if="paramRows.length">
      <h4 class="process-info__sub">Parameters</h4>
      <dl class="process-info__list">
        <template v-for="[name, value] in paramRows" :key="name">
          <dt>{{ name }}</dt>
          <dd>{{ typeof value === 'object' ? JSON.stringify(value) : value }}</dd>
        </template>
      </dl>
    </template>
    <template v-if="prompt">
      <h4 class="process-info__sub">Prompt</h4>
      <pre class="process-info__prompt">{{ prompt }}</pre>
    </template>
  </section>
</template>

<style scoped>
.process-info {
  margin-block-start: var(--md-space-3);
}

.process-info__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.process-info__title,
.process-info__sub {
  margin: 0;
  font-size: var(--md-font-size-sm);
  font-weight: 600;
}

.process-info__sub {
  margin-block-start: var(--md-space-3);
}

.process-info__list {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: var(--md-space-1) var(--md-space-3);
  margin: var(--md-space-2) 0 0;
  font-size: var(--md-font-size-sm);
}

.process-info__list dt {
  color: var(--md-color-text-muted);
}

.process-info__list dd {
  margin: 0;
  word-break: break-word;
}

.process-info__prompt {
  margin: var(--md-space-1) 0 0;
  padding: var(--md-space-2);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-bg);
  font-size: var(--md-font-size-xs);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
