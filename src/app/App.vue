<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { session } from '@/stores/session.js'
import { ready } from '@/api/session.js'
import { connect as connectEvents, disconnect as disconnectEvents } from '@/services/events.js'
import AppShell from './AppShell.vue'
// eslint-disable-next-line no-restricted-imports -- replaced in stage 7
import BatchProgressPanel from '@/components/BatchProgressPanel.vue'

const route = useRoute()
let pingTimer = null

// Session check by polling; replaced by a 401 handler in api/ in stage 8.
async function checkSession() {
  try {
    await ready()
    if (window.location.pathname.includes('login'))
      window.location.href = import.meta.env.VITE_PUBLIC_PATH || '/'
  } catch (e) {
    if (e.status == 401 && !window.location.pathname.includes('login')) {
      window.location.href = 'login'
    } else {
      session.expired = e.status == 302
    }
  }
}

function reload() {
  window.location.reload()
}

onMounted(() => {
  checkSession()
  pingTimer = setInterval(checkSession, 30000)
  connectEvents()
})

onUnmounted(() => {
  clearInterval(pingTimer)
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
      <div v-if="route.meta.shell === false" :class="{ 'legacy-screen': route.meta.legacy }">
        <router-view />
      </div>
      <AppShell v-else>
        <router-view />
      </AppShell>
      <BatchProgressPanel />
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
