<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { session } from '@/stores/session.js'
import { ready } from '@/api/session.js'
import { onAuthError } from '@/api/client.js'
import { connect as connectEvents, disconnect as disconnectEvents } from '@/services/events.js'
import AppShell from './AppShell.vue'
import JobsPanel from '@/features/jobs/JobsPanel.vue'

const route = useRoute()
const onLoginPage = () => window.location.pathname.includes('login')

// Any API call that comes back 401 (no account) sends the user to the login
// page; a 302 (the sign-in proxy redirecting) means the session has expired.
function handleAuthError(status) {
  if (status === 401) {
    if (!onLoginPage()) window.location.href = 'login'
  } else {
    session.expired = true
  }
}

// One check on start and whenever the tab comes back into view, so an expired
// session shows up before the user tries to do something.
async function checkSession() {
  try {
    await ready()
    if (onLoginPage()) window.location.href = import.meta.env.VITE_PUBLIC_PATH || '/'
  } catch {
    // handleAuthError has dealt with it.
  }
}

function onVisible() {
  if (document.visibilityState === 'visible') checkSession()
}

function reload() {
  window.location.reload()
}

onMounted(() => {
  onAuthError(handleAuthError)
  checkSession()
  document.addEventListener('visibilitychange', onVisible)
  connectEvents()
})

onUnmounted(() => {
  onAuthError(null)
  document.removeEventListener('visibilitychange', onVisible)
  disconnectEvents()
})
</script>

<template>
  <v-app>
    <div v-if="session.expired" class="session-expired">
      <v-alert type="error" variant="tonal" title="Your session has expired">
        <template #append>
          <v-btn color="error" variant="flat" @click="reload"> Reload page </v-btn>
        </template>
      </v-alert>
    </div>
    <template v-else>
      <router-view v-if="route.meta.shell === false" />
      <AppShell v-else>
        <router-view />
      </AppShell>
      <JobsPanel />
    </template>
  </v-app>
</template>

<style scoped>
.session-expired {
  max-width: 560px;
  margin: var(--md-space-7) auto;
  padding: 0 var(--md-space-4);
}
</style>
