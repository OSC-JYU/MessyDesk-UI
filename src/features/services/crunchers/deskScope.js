import { inject, provide } from 'vue'

const KEY = Symbol('cruncher-desk')

// The desk a cruncher form works in, so parameter fields (the tag picker) can use the desk's own
// tags without every layer between passing the desk along.
export function provideDesk(getDesk) {
  provide(KEY, getDesk)
}

// Returns a function giving the current desk rid ('' outside a desk).
export function injectDesk() {
  return inject(KEY, () => '')
}
