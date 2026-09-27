import { batchStore } from '@/stores/batchStore'

let source = null
let reconnectTimer = null
const RECONNECT_DELAY = 5000

export function connect() {
  if (source) {
    source.close()
    source = null
  }

  const url = `${import.meta.env.VITE_API_PATH}/events`
  source = new EventSource(url)

  source.onopen = () => {
    console.log('SSE connected')
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    // Hydrate on reconnect to recover missed events
    batchStore.hydrate()
  }

  source.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      routeEvent(data)
    } catch (e) {
      // ignore parse errors
    }
  }

  source.onerror = () => {
    if (source) {
      source.close()
      source = null
    }
    reconnectTimer = setTimeout(connect, RECONNECT_DELAY)
  }
}

export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (source) {
    source.close()
    source = null
  }
}

export function getEventSource() {
  return source
}

function routeEvent(data) {
  if (!data?.command) return

  // Route batch/process events to batchStore
  switch (data.command) {
    case 'batch_started':
    case 'batch_progress':
    case 'batch_paused':
    case 'batch_resumed':
    case 'batch_completed':
    case 'batch_cancelled':
    case 'batch_error':
    case 'batch_failed':
    case 'process_update':
    case 'process_finished':
      batchStore.handleEvent(data)
      break
  }

  // Dispatch a custom DOM event so components can still listen for graph updates
  // without creating their own EventSource
  window.dispatchEvent(new CustomEvent('md-sse', { detail: data }))
}
