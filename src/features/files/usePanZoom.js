import { computed, reactive } from 'vue'

// Wheel zoom (0.5×–3×) and drag-to-pan for an image stage.
export function usePanZoom({ min = 0.5, max = 3 } = {}) {
  const view = reactive({ scale: 1, x: 0, y: 0, panning: false, lastX: 0, lastY: 0 })

  const style = computed(() => ({
    transform: `scale(${view.scale}) translate(${view.x}px, ${view.y}px)`,
    cursor: view.scale > 1 ? (view.panning ? 'grabbing' : 'grab') : 'default',
  }))

  function setScale(next) {
    view.scale = Math.max(min, Math.min(max, next))
    if (view.scale <= 1) Object.assign(view, { x: 0, y: 0 })
  }

  function onWheel(event) {
    const old = view.scale
    setScale(view.scale + (event.deltaY > 0 ? -0.1 : 0.1))
    if (view.scale > 1) {
      const rect = event.currentTarget.getBoundingClientRect()
      view.x += (event.clientX - rect.left - rect.width / 2) * (1 - old / view.scale)
      view.y += (event.clientY - rect.top - rect.height / 2) * (1 - old / view.scale)
    }
  }

  function onDown(event) {
    if (view.scale <= 1 || event.button !== 0) return
    Object.assign(view, { panning: true, lastX: event.clientX, lastY: event.clientY })
  }

  function onMove(event) {
    if (!view.panning) return
    view.x += (event.clientX - view.lastX) / (view.scale * 0.5)
    view.y += (event.clientY - view.lastY) / (view.scale * 0.5)
    Object.assign(view, { lastX: event.clientX, lastY: event.clientY })
  }

  return {
    view,
    style,
    zoomIn: () => setScale(view.scale + 0.25),
    zoomOut: () => setScale(view.scale - 0.25),
    reset: () => Object.assign(view, { scale: 1, x: 0, y: 0 }),
    onWheel,
    // Mouse handlers for the stage (bind with v-on); bind onWheel with @wheel.prevent.
    handlers: {
      mousedown: onDown,
      mousemove: onMove,
      mouseup: () => (view.panning = false),
      mouseleave: () => (view.panning = false),
    },
    min,
    max,
  }
}
