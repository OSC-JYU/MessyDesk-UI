<script setup>
import { computed } from 'vue'
import { batchStore } from '@/stores/batchStore'

const jobs = computed(() => Object.values(batchStore.jobs).filter(j =>
  ['running', 'paused', 'queued', 'pausing', 'resuming', 'cancelling', 'failed'].includes(j.status)
))

const collapsed = computed(() => !batchStore.hasActiveJobs)
const minimized = computed(() => batchStore.minimized)

function toggleMinimized() {
  batchStore.minimized = !batchStore.minimized
}

function progressPercent(job) {
  if (!job.total_files || job.total_files === 0) return 0
  return Math.round((job.processed_files / job.total_files) * 100)
}

function formatEta(job) {
  if (!job.eta_sec || job.eta_sec <= 0) return ''
  const sec = Math.round(job.eta_sec)
  if (sec < 60) return `${sec}s`
  const min = Math.floor(sec / 60)
  const rem = sec % 60
  return rem > 0 ? `${min}m ${rem}s` : `${min}m`
}

function formatServiceName(job) {
  const id = job.service_id || job.queue || ''
  if (!id) return 'Processing'
  // Strip common prefixes and suffixes for display
  return id.replace(/^md-/, '').replace(/_fs$/, '').replace(/_batch$/, '')
}

function statusColor(status) {
  const colors = {
    queued: 'grey',
    running: 'teal',
    pausing: 'amber',
    paused: 'amber',
    resuming: 'teal',
    cancelling: 'red',
    done: 'green',
    failed: 'red',
    cancelled: 'grey'
  }
  return colors[status] || 'grey'
}

function statusIcon(status) {
  const icons = {
    queued: 'mdi-clock-outline',
    running: 'mdi-play-circle',
    pausing: 'mdi-pause-circle',
    paused: 'mdi-pause-circle',
    resuming: 'mdi-play-circle',
    cancelling: 'mdi-close-circle',
    done: 'mdi-check-circle',
    failed: 'mdi-alert-circle',
    cancelled: 'mdi-close-circle'
  }
  return icons[status] || 'mdi-help-circle'
}

function canPause(job) {
  return job.status === 'running'
}

function canResume(job) {
  return job.status === 'paused'
}

function canCancel(job) {
  return ['running', 'paused', 'queued'].includes(job.status)
}

function pause(rid) {
  batchStore.pause(rid)
}

function resume(rid) {
  batchStore.resume(rid)
}

function cancel(rid) {
  batchStore.cancel(rid)
}

function dismiss(rid) {
  batchStore.dismiss(rid)
}
</script>

<template>
  <div v-if="jobs.length > 0" class="batch-progress-panel">
    <!-- Minimized: compact chip -->
    <v-btn
      v-if="minimized"
      class="minimized-chip"
      color="teal"
      variant="elevated"
      size="small"
      rounded="pill"
      @click="toggleMinimized"
    >
      <v-icon size="small" class="mr-1">mdi-progress-wrench</v-icon>
      {{ jobs.length }} active
    </v-btn>

    <!-- Expanded panel -->
    <v-card v-else elevation="4" class="batch-card">
      <v-card-title class="d-flex align-center py-2 px-3">
        <v-icon size="small" class="mr-2">mdi-progress-wrench</v-icon>
        <span class="text-body-2 font-weight-medium">Active Jobs ({{ jobs.length }})</span>
        <v-spacer />
        <v-btn
          icon
          size="x-small"
          variant="text"
          density="compact"
          @click="toggleMinimized"
          title="Minimize"
        >
          <v-icon size="small">mdi-window-minimize</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0 batch-list">
        <div v-for="job in jobs" :key="job.rid" class="batch-item pa-3">
          <div class="d-flex align-center mb-1">
            <v-icon
              :color="statusColor(job.status)"
              size="small"
              :class="{ 'pulse-icon': ['pausing', 'resuming', 'cancelling'].includes(job.status) }"
              class="mr-2"
            >
              {{ statusIcon(job.status) }}
            </v-icon>
            <span class="text-body-2 font-weight-medium text-truncate">
              {{ formatServiceName(job) }}
            </span>
            <v-spacer />
            <v-chip size="x-small" :color="statusColor(job.status)" variant="tonal">
              {{ job.status }}
            </v-chip>
          </div>

          <div class="d-flex align-center text-caption text-medium-emphasis mb-1">
            <span>{{ job.processed_files || 0 }}/{{ job.total_files || '?' }} files</span>
            <span v-if="job.failed_files > 0" class="ml-2 text-red">
              {{ job.failed_files }} failed
            </span>
            <v-spacer />
            <span v-if="formatEta(job)">ETA {{ formatEta(job) }}</span>
          </div>

          <v-progress-linear
            :model-value="progressPercent(job)"
            :color="statusColor(job.status)"
            height="4"
            rounded
            class="mb-2"
          />

          <div class="d-flex ga-1">
            <v-btn
              v-if="canPause(job)"
              size="x-small"
              variant="tonal"
              color="amber"
              @click="pause(job.rid)"
            >
              Pause
            </v-btn>
            <v-btn
              v-if="canResume(job)"
              size="x-small"
              variant="tonal"
              color="teal"
              @click="resume(job.rid)"
            >
              Resume
            </v-btn>
            <v-btn
              v-if="canCancel(job)"
              size="x-small"
              variant="tonal"
              color="red"
              @click="cancel(job.rid)"
            >
              Cancel
            </v-btn>
            <v-spacer />
            <v-btn
              size="x-small"
              variant="text"
              color="grey"
              @click="dismiss(job.rid)"
              title="Dismiss from list"
            >
              <v-icon size="small">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
.batch-progress-panel {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
  max-width: 360px;
  min-width: 280px;
}

.batch-card {
  max-height: 400px;
  display: flex;
  flex-direction: column;
}

.batch-list {
  overflow-y: auto;
  max-height: 320px;
}

.batch-item + .batch-item {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.minimized-chip {
  text-transform: none;
}

.pulse-icon {
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
