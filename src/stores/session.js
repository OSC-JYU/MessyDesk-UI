import { reactive } from 'vue'
import { getMe } from '@/api/session.js'

// The signed-in user. Loaded once by the app shell; the router guard and the
// old global store read the same object.
export const session = reactive({
  user: null,
  // Set when the backend reports an expired session (HTTP 302 on any request).
  expired: false,
  loading: null,

  get isAdmin() {
    return this.user?.access === 'admin'
  },

  async loadUser() {
    if (this.user) return this.user
    if (!this.loading) {
      this.loading = getMe()
        .then((user) => (this.user = user))
        .catch(() => null)
        .finally(() => (this.loading = null))
    }
    return this.loading
  },
})
