import { reactive } from 'vue'

// A button action with a loading state and a result message.
export function useTask() {
  const task = reactive({ running: false, message: '', type: 'info' })
  async function run(action, { start = '', done = '', failed = 'Something went wrong.' } = {}) {
    if (task.running) return
    Object.assign(task, { running: true, message: start, type: 'info' })
    try {
      const result = await action((message) => (task.message = message))
      Object.assign(task, {
        message: typeof done === 'function' ? done(result) : done,
        type: 'success',
      })
    } catch (error) {
      Object.assign(task, { message: error?.message || failed, type: 'error' })
    } finally {
      task.running = false
    }
  }
  function reset() {
    Object.assign(task, { running: false, message: '', type: 'info' })
  }
  return { task, run, reset }
}
