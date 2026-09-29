<script setup>
import { computed } from 'vue'
import { batchStore } from '@/stores/batchStore.js'
import StatusChip from '@/ui/StatusChip.vue'

// Floating panel of batch jobs (a cruncher run over a set), fed live by
// server events. Can be minimised to a chip.
const SHOWN = ['running', 'paused', 'queued', 'pausing', 'resuming', 'cancelling', 'failed']
const jobs = computed(() =>
  Object.values(batchStore.jobs).filter((job) => SHOWN.includes(job.status)),
)

const percent = (job) =>
  job.total_files ? Math.round((job.processed_files / job.total_files) * 100) : 0
const service = (job) =>
  String(job.service_id || job.queue || 'Processing')
    .replace(/^md-/, '')
    .replace(/_(fs|batch)$/, '')

function eta(job) {
  const sec = Math.round(job.eta_sec || 0)
  if (sec <= 0) return ''
  if (sec < 60) return `${sec}s`
  return sec % 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec / 60}m`
}
</script>

<template>
  <div v-if="jobs.length" class="jobs" role="region" aria-label="Active jobs">
    <v-btn
      v-if="batchStore.minimized"
      color="primary"
      variant="elevated"
      rounded="pill"
      prepend-icon="mdi-progress-wrench"
      @click="batchStore.minimized = false"
    >
      {{ jobs.length }} active
    </v-btn>
    <v-card v-else rounded="lg" class="jobs__card">
      <header class="jobs__head">
        <v-icon icon="mdi-progress-wrench" size="18" aria-hidden="true" />
        <span class="jobs__title">Active jobs ({{ jobs.length }})</span>
        <v-btn
          icon="mdi-window-minimize"
          size="x-small"
          variant="text"
          aria-label="Minimise"
          @click="batchStore.minimized = true"
        />
      </header>
      <ul class="jobs__list">
        <li v-for="job in jobs" :key="job.rid" class="jobs__item">
          <div class="jobs__row">
            <strong class="jobs__service">{{ service(job) }}</strong>
            <StatusChip :status="job.status" />
          </div>
          <div class="jobs__row jobs__muted">
            <span>{{ job.processed_files || 0 }}/{{ job.total_files || '?' }} files</span>
            <span v-if="job.failed_files > 0" class="jobs__failed"
              >{{ job.failed_files }} failed</span
            >
            <span v-if="eta(job)" class="jobs__eta">ETA {{ eta(job) }}</span>
          </div>
          <v-progress-linear
            :model-value="percent(job)"
            color="primary"
            height="4"
            rounded
            class="my-2"
          />
          <div class="jobs__row">
            <v-btn
              v-if="job.status === 'running'"
              size="x-small"
              variant="tonal"
              color="warning"
              @click="batchStore.pause(job.rid)"
              >Pause</v-btn
            >
            <v-btn
              v-if="job.status === 'paused'"
              size="x-small"
              variant="tonal"
              color="primary"
              @click="batchStore.resume(job.rid)"
              >Resume</v-btn
            >
            <v-btn
              v-if="['running', 'paused', 'queued'].includes(job.status)"
              size="x-small"
              variant="tonal"
              color="error"
              @click="batchStore.cancel(job.rid)"
            >
              Cancel
            </v-btn>
            <v-spacer />
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              :aria-label="`Dismiss ${service(job)}`"
              @click="batchStore.dismiss(job.rid)"
            />
          </div>
        </li>
      </ul>
    </v-card>
  </div>
</template>

<style scoped>
.jobs {
  position: fixed;
  right: var(--md-space-4);
  bottom: var(--md-space-4);
  z-index: 1000;
}

.jobs__card {
  width: calc(var(--md-card-min-width) * 1.15);
  box-shadow: var(--md-shadow-3);
}

.jobs__head {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-2) var(--md-space-3);
  border-bottom: 1px solid var(--md-color-border);
}

.jobs__title {
  flex: 1;
  font-weight: var(--md-font-weight-medium);
}

.jobs__list {
  max-height: 50dvh;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.jobs__item {
  padding: var(--md-space-3);
  border-bottom: 1px solid var(--md-color-border);
}

.jobs__row {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
}

.jobs__service {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jobs__muted {
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.jobs__failed {
  color: var(--md-color-error);
}

.jobs__eta {
  margin-inline-start: auto;
}
</style>
