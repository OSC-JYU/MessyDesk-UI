# Proposal: Batch Progress UI Overhaul

**Status**: Draft  
**Date**: 2026-08-13  
**Related**: [Backend queue proposal](../../MessyDesk/wiki/proposals/sqlite-queue-batch-simplification.md)

## Motivation

1. Users need to see batch progress at all times, not just on the project graph page.
2. Pause/resume/cancel must be accessible from anywhere in the app.
3. The current dual-SSE-listener pattern (Main.vue + GraphDisplay.vue) independently updates shared state, creating inconsistency and duplication.
4. Messaging between backend and UI must be centralized and predictable.

## Current Problems

- SSE listeners are created in two separate components (Main.vue and GraphDisplay.vue) — same events handled with different code paths.
- Progress is only controllable (pause/resume/cancel) from GraphDisplay; Main.vue is read-only.
- 3-second polling timer runs alongside SSE, adding complexity without clear benefit.
- `store.running_processes` is mutated from multiple components with no single owner.
- Event format is inconsistent between SSE pushes and poll responses.

## Proposed Design

### 1. Single SSE Connection Service

Create a dedicated module `src/services/events.js` that:
- Opens ONE `EventSource` connection to `/events` on app startup
- Parses all incoming events
- Routes batch events to a centralized batch state manager
- Reconnects automatically on disconnect
- Is completely independent of component lifecycle

```javascript
// src/services/events.js
import { batchStore } from '@/stores/batchStore'

let source = null

export function connect() {
    source = new EventSource(`${import.meta.env.VITE_API_PATH}/events`)
    source.onmessage = (event) => {
        const data = JSON.parse(event.data)
        routeEvent(data)
    }
    source.onerror = () => {
        // reconnect with backoff
    }
}

function routeEvent(data) {
    switch (data.command) {
        case 'batch_started':
        case 'batch_progress':
        case 'batch_paused':
        case 'batch_resumed':
        case 'batch_completed':
        case 'batch_cancelled':
        case 'batch_error':
        case 'batch_failed':
            batchStore.handleEvent(data)
            break
        // other event types...
    }
}
```

**Components never create their own EventSource.** They read from the store.

### 2. Centralized Batch Store

Replace the ad-hoc `store.running_processes` with a dedicated reactive store:

```javascript
// src/stores/batchStore.js
import { reactive } from 'vue'
import * as web from '@/web'

export const batchStore = reactive({
    // Map of set_process RID → job state
    jobs: {},
    
    // Computed: any job running?
    get hasActiveJobs() {
        return Object.values(this.jobs).some(j => 
            ['running', 'paused', 'queued'].includes(j.status)
        )
    }
})

// --- Event handler (called by events service) ---
batchStore.handleEvent = function(event) {
    const rid = event.set_process
    if (!this.jobs[rid]) {
        this.jobs[rid] = { rid, status: 'unknown' }
    }
    const job = this.jobs[rid]
    
    switch (event.command) {
        case 'batch_started':
            Object.assign(job, {
                status: 'running',
                service_id: event.service_id,
                total_files: event.total_files,
                processed_files: 0,
                failed_files: 0,
                started_at: Date.now()
            })
            break
            
        case 'batch_progress':
            Object.assign(job, {
                processed_files: event.processed_files,
                total_files: event.total_files,
                failed_files: event.failed_files,
                current_file_label: event.current_file_label,
                avg_sec_per_file: event.avg_sec_per_file,
                eta_sec: event.eta_sec
            })
            break
            
        case 'batch_paused':
            job.status = 'paused'
            break
            
        case 'batch_resumed':
            job.status = 'running'
            break
            
        case 'batch_completed':
            Object.assign(job, {
                status: 'done',
                total_time_sec: event.total_time_sec
            })
            // Auto-remove after delay
            setTimeout(() => delete this.jobs[rid], 10000)
            break
            
        case 'batch_cancelled':
            job.status = 'cancelled'
            setTimeout(() => delete this.jobs[rid], 5000)
            break
            
        case 'batch_failed':
            Object.assign(job, {
                status: 'failed',
                error_message: event.error_message
            })
            break
            
        case 'batch_error':
            job.failed_files = event.failed_files || (job.failed_files || 0) + 1
            break
    }
}

// --- Actions (called by UI components) ---
batchStore.pause = async function(rid) {
    this.jobs[rid].status = 'pausing'  // optimistic
    await web.pauseBatch(rid)
}

batchStore.resume = async function(rid) {
    this.jobs[rid].status = 'resuming'  // optimistic
    await web.resumeBatch(rid)
}

batchStore.cancel = async function(rid) {
    this.jobs[rid].status = 'cancelling'  // optimistic
    await web.cancelBatch(rid)
}

// --- Initialization (on app load) ---
batchStore.hydrate = async function() {
    const active = await web.getActiveJobs()
    for (const job of active) {
        this.jobs[job.set_process] = job
    }
}
```

### 3. Persistent Progress Panel Component

A floating/docked panel visible from **any page**:

```
┌─────────────────────────────────────────────┐
│ ▾ Active Jobs (2)                           │
├─────────────────────────────────────────────┤
│ ◉ Resize  23/50 files  ETA 1m 20s          │
│   ████████████████░░░░░░░░  46%             │
│   [Pause] [Cancel]                          │
├─────────────────────────────────────────────┤
│ ⏸ OCR  12/30 files  (paused)               │
│   ████████░░░░░░░░░░░░░░░  40%             │
│   [Resume] [Cancel]                         │
└─────────────────────────────────────────────┘
```

#### Component: `BatchProgressPanel.vue`

- Always rendered in `App.vue` (outside router-view)
- Conditionally visible when `batchStore.hasActiveJobs` is true
- Collapsible (user can minimize to a small badge showing count)
- Shows all active/paused/failing jobs with:
  - Service name and task
  - Progress bar (`processed_files / total_files`)
  - ETA (computed from `avg_sec_per_file`)
  - Failed file count (if > 0)
  - Pause/Resume/Cancel buttons per job
  - Status chip (color-coded)

#### Status colors

| Status | Color | Icon |
|--------|-------|------|
| `queued` | grey | `mdi-clock-outline` |
| `running` | teal | `mdi-play-circle` |
| `pausing` | amber | `mdi-pause-circle` (pulsing) |
| `paused` | amber | `mdi-pause-circle` |
| `resuming` | teal | `mdi-play-circle` (pulsing) |
| `cancelling` | red | `mdi-close-circle` (pulsing) |
| `done` | green | `mdi-check-circle` |
| `failed` | red | `mdi-alert-circle` |

### 4. Remove Duplicated Event Handling

| Remove | Replacement |
|--------|-------------|
| SSE listener in `Main.vue` | `events.js` service (app-level) |
| SSE listener in `GraphDisplay.vue` | `events.js` service (app-level) |
| `store.running_processes` | `batchStore.jobs` |
| 3-second polling timer | SSE events only (hydrate on reconnect) |
| `hydrateBatchInfo()` in components | `batchStore.hydrate()` on app load + reconnect |

### 5. API Layer Updates (`web.js`)

```javascript
// New/updated functions:
export function getActiveJobs() {
    return axios.get('/api/queue/jobs/active').then(r => r.data)
}

export function pauseBatch(set_process_rid) {
    return axios.post(`/api/queue/${rid(set_process_rid)}/pause`)
}

export function resumeBatch(set_process_rid) {
    return axios.post(`/api/queue/${rid(set_process_rid)}/resume`)
}

export function cancelBatch(set_process_rid) {
    return axios.post(`/api/queue/${rid(set_process_rid)}/cancel`)
}
```

## File Changes Summary

| File | Action |
|------|--------|
| `src/services/events.js` | **New** — Single SSE connection manager |
| `src/stores/batchStore.js` | **New** — Centralized batch state + actions |
| `src/components/BatchProgressPanel.vue` | **New** — Floating progress panel |
| `src/App.vue` | Add `<BatchProgressPanel />` + call `events.connect()` on mount |
| `src/main.js` | Call `batchStore.hydrate()` after auth resolves |
| `src/web.js` | Add `getActiveJobs()`, update pause/resume/cancel to use queue endpoints |
| `src/components/Main.vue` | Remove SSE listener, remove `running_processes` logic |
| `src/components/GraphDisplay.vue` | Remove SSE listener, remove polling timer, read from `batchStore` |
| `src/components/Store.js` | Remove `running_processes` (moved to batchStore) |

## Design Principles

1. **Single SSE connection** — one EventSource per app session, managed outside component lifecycle.
2. **Single source of truth** — `batchStore` owns all batch state. Components are readers. Only `batchStore.handleEvent()` and `batchStore.hydrate()` write.
3. **Optimistic UI** — Pause/resume buttons immediately update to transitional state (`pausing`, `resuming`). Backend SSE confirms actual state change.
4. **Always visible** — Panel floats outside router-view. User never loses sight of running jobs.
5. **No polling** — SSE provides real-time updates. On reconnect, hydrate from `GET /api/queue/jobs/active` to recover missed events.
6. **Graceful degradation** — If SSE disconnects, show "reconnecting" indicator. On reconnect, full hydration restores accurate state.

## State Flow Diagram

```
User clicks Pause
    ↓
BatchProgressPanel calls batchStore.pause(rid)
    ↓
batchStore: job.status = 'pausing' (optimistic)
    ↓
web.pauseBatch(rid) → POST /api/queue/{job_id}/pause
    ↓
Backend: mark job paused in SQLite
Backend: signal consumer POST {adapter_url}/jobs/{job_id}/pause
Backend: emit SSE { command: 'batch_paused', set_process: rid, ... }
    ↓
events.js receives SSE → batchStore.handleEvent()
    ↓
batchStore: job.status = 'paused' (confirmed)
    ↓
BatchProgressPanel reactively updates: shows Resume button
```

## Deletion Guard

When a user attempts to delete a cruncher/SetProcess node from the graph:

1. UI checks `batchStore.jobs[rid]` for that node's RID
2. If job exists with status `running`, `queued`, `pausing`, or `resuming` → **block deletion**, show message: "Pause or cancel the batch job before removing this node."
3. If job status is `paused` → allow deletion. Backend will clean up the SQLite queue entry.
4. If no active job (status `done`, `failed`, `cancelled`, or not in batchStore) → allow deletion normally.

The backend also enforces this (returns 409 Conflict), so the UI check is a UX convenience — the operation would fail server-side regardless.

## Open Questions

1. **Panel position** — Bottom-right floating? Top banner? Sidebar drawer? Should be unobtrusive but always reachable.

2. **Completed job retention** — How long to show "done" jobs before hiding? Currently proposed: 10 seconds with fade-out. Could be configurable or have a "history" view.

3. **Per-file error detail** — Should the panel show which specific files failed, or just the count? A click-to-expand detail view seems right for non-trivial batches.

4. **Multiple batch jobs** — If user starts 5 batches, the panel grows. Should it scroll internally or collapse to summary?
