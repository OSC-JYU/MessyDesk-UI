import { onUnmounted, ref } from 'vue'

// Calls `fn` every `intervalMs` while `live` is on; stops when the component
// using it unmounts.
export function usePolling(fn, intervalMs) {
  const live = ref(false)
  let timer = null

  function stop() {
    clearInterval(timer)
    timer = null
    live.value = false
  }

  function start() {
    stop()
    timer = setInterval(fn, intervalMs)
    live.value = true
  }

  function toggle() {
    if (live.value) stop()
    else start()
  }

  onUnmounted(stop)
  return { live, start, stop, toggle }
}
