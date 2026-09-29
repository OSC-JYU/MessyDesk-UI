import { reactive } from 'vue'
import web from '../web.js'

export const batchStore = reactive({
  // Map of set_process RID → job state
  jobs: {},
  minimized: false,

  get hasActiveJobs() {
    return Object.values(this.jobs).some((j) =>
      ['running', 'paused', 'queued', 'pausing', 'resuming', 'cancelling'].includes(j.status),
    )
  },

  get activeJobCount() {
    return Object.values(this.jobs).filter((j) =>
      ['running', 'paused', 'queued', 'pausing', 'resuming', 'cancelling'].includes(j.status),
    ).length
  },
})

// --- Event handler (called by events service) ---
batchStore.handleEvent = function (event) {
  const rid = event.set_process || event.process?.['@rid']
  if (!rid) return

  if (!this.jobs[rid]) {
    this.jobs[rid] = {
      rid,
      status: 'unknown',
      service_id: '',
      total_files: 0,
      processed_files: 0,
      failed_files: 0,
    }
  }
  const job = this.jobs[rid]

  switch (event.command) {
    case 'batch_started':
      Object.assign(job, {
        status: 'running',
        service_id: event.service_id || job.service_id,
        total_files: event.total_files || job.total_files,
        processed_files: 0,
        failed_files: 0,
        started_at: Date.now(),
      })
      break

    case 'process_update':
      if (event.batch) {
        Object.assign(job, {
          status: getBatchStatus(event.batch, event.process?.status || 'running'),
          processed_files: event.batch.processed_files ?? event.current_file ?? job.processed_files,
          total_files: event.batch.total_files ?? event.total_files ?? job.total_files,
          failed_files: event.batch.failed_files ?? job.failed_files,
          avg_sec_per_file: event.batch.avg_sec_per_file,
          eta_sec: event.batch.eta_sec,
        })
      }
      break

    case 'batch_progress':
      Object.assign(job, {
        status: 'running',
        processed_files: event.processed_files ?? job.processed_files,
        total_files: event.total_files ?? job.total_files,
        failed_files: event.failed_files ?? job.failed_files,
        avg_sec_per_file: event.avg_sec_per_file,
        eta_sec: event.eta_sec,
      })
      break

    case 'batch_paused':
      job.status = 'paused'
      break

    case 'batch_resumed':
      job.status = 'running'
      break

    case 'process_finished':
    case 'batch_completed':
      Object.assign(job, {
        status: 'done',
        total_time_sec: event.total_time_sec || event.batch?.total_time_sec,
      })
      if (event.batch) {
        job.processed_files = event.batch.processed_files ?? job.processed_files
        job.total_files = event.batch.total_files ?? job.total_files
      }
      setTimeout(() => delete this.jobs[rid], 10000)
      break

    case 'batch_cancelled':
      job.status = 'cancelled'
      setTimeout(() => delete this.jobs[rid], 5000)
      break

    case 'batch_failed':
      Object.assign(job, {
        status: 'failed',
        error_message: event.error_message,
      })
      break

    case 'batch_error':
      job.failed_files = event.failed_files || (job.failed_files || 0) + 1
      break
  }
}

// --- Actions (called by UI components) ---
batchStore.pause = async function (rid) {
  if (this.jobs[rid]) this.jobs[rid].status = 'pausing'
  await web.pauseBatch(rid)
}

batchStore.resume = async function (rid) {
  if (this.jobs[rid]) this.jobs[rid].status = 'resuming'
  await web.resumeBatch(rid)
}

batchStore.cancel = async function (rid) {
  if (this.jobs[rid]) this.jobs[rid].status = 'cancelling'
  await web.cancelBatch(rid)
}

batchStore.dismiss = async function (rid) {
  try {
    await web.dismissJob(rid)
  } catch (e) {
    console.log('dismiss failed:', e?.message)
  }
  delete this.jobs[rid]
}

// --- Hydration (on app load / reconnect) ---
batchStore.hydrate = async function () {
  try {
    const active = await web.getActiveJobs()
    if (Array.isArray(active)) {
      for (const job of active) {
        const rid = job.set_process || job.rid
        if (rid) this.jobs[rid] = job
      }
    }
  } catch (e) {
    // Queue endpoint may not be available yet
    console.log('batchStore.hydrate: endpoint not available', e?.message)
  }
}

// --- Guard: check if a process RID has an active job ---
batchStore.isActive = function (rid) {
  const job = this.jobs[rid]
  if (!job) return false
  return ['running', 'queued', 'pausing', 'resuming'].includes(job.status)
}

function getBatchStatus(batch, fallback) {
  if (!batch) return fallback || 'running'
  if (batch.status === 'paused') return 'paused'
  if (batch.status === 'cancelled' || batch.status === 'cancelling') return batch.status
  if (batch.status === 'done') return 'done'
  if (batch.status === 'failed') return 'failed'
  return fallback || 'running'
}
