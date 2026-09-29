import { reactive } from 'vue'

// Remembers the state of a screen per scope (a project, or 'global') for the
// browser session, so going back to Search or Tags shows what was there.
const memory = reactive({})

export function recall(screen, scope) {
  return memory[screen]?.[scope] || null
}

export function remember(screen, scope, snapshot) {
  memory[screen] ??= {}
  memory[screen][scope] = snapshot
}
