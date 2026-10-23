<script setup>
import { onMounted, reactive } from 'vue'
import {
  forgetService,
  getServices,
  installService,
  reloadServices,
  startService,
  stopService,
} from '@/api/services.js'
import PageHeader from '@/ui/PageHeader.vue'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'
import InstallServiceDialog from './InstallServiceDialog.vue'
import { isRunning, serviceSource, toServiceList } from './serviceStatus.js'

// Admin controls for services: install, start, stop, forget, reload. The
// router only lets admins in.
const state = reactive({
  services: [],
  loading: true,
  error: null,
  notice: '',
  busyId: null,
  installOpen: false,
  forget: { open: false, service: null, pending: false, error: '' },
})

async function load() {
  try {
    state.services = toServiceList(await getServices())
    state.error = null
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
}

async function run(service, action, done) {
  state.busyId = service?.id || 'all'
  state.error = null
  state.notice = ''
  try {
    const result = await action()
    state.notice = done(result)
    await load()
  } catch (error) {
    state.error = error
  } finally {
    state.busyId = null
  }
}

const start = (s) =>
  run(
    s,
    () => startService(s.id, s.nomad_hcl),
    () => `Started ${s.id}.`,
  )
const stop = (s) =>
  run(
    s,
    () => stopService(s.id),
    () => `Stopped ${s.id}.`,
  )
const reload = () => run(null, reloadServices, () => 'Reloaded services from disk.')

async function install(payload) {
  await installService(payload)
  state.notice = `Installed ${payload.id}.`
  await load()
}

function askForget(service) {
  Object.assign(state.forget, { open: true, service, pending: false, error: '' })
}

async function confirmForget() {
  const service = state.forget.service
  state.forget.pending = true
  try {
    const result = await forgetService(service.id)
    state.notice =
      result?.status === 'not_found'
        ? `${service.id} was not in the registry.`
        : `Forgot ${service.id}.`
    state.forget.open = false
    await load()
  } catch (error) {
    state.forget.error = error?.message || `Could not forget ${service.id}.`
  } finally {
    state.forget.pending = false
  }
}

onMounted(load)
</script>

<template>
  <div class="control-page">
    <PageHeader title="Service control" subtitle="Install, start, stop and forget services.">
      <template #actions>
        <v-btn
          size="small"
          variant="text"
          prepend-icon="mdi-view-dashboard-outline"
          :to="{ name: 'services' }"
        >
          Monitor
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          prepend-icon="mdi-reload"
          :loading="state.busyId === 'all'"
          @click="reload"
        >
          Reload
        </v-btn>
        <v-btn
          color="primary"
          size="small"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="state.installOpen = true"
        >
          Install
        </v-btn>
      </template>
    </PageHeader>

    <ErrorAlert :error="state.error" title="Service action failed" class="mb-4" />
    <v-alert
      v-if="state.notice"
      type="success"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="state.notice = ''"
    >
      {{ state.notice }}
    </v-alert>

    <LoadingState v-if="state.loading" text="Loading services…" />
    <v-card v-else rounded="lg" flat class="control-page__card">
      <EmptyState v-if="!state.services.length" icon="mdi-cogs" title="No services registered" />
      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Service</th>
            <th>Source</th>
            <th>Status</th>
            <th class="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in state.services" :key="service.id">
            <td>
              <div class="control-page__name">{{ service.name || service.id }}</div>
              <div class="control-page__id">{{ service.id }}</div>
            </td>
            <td>
              <v-chip size="x-small" variant="outlined" label>{{ serviceSource(service) }}</v-chip>
            </td>
            <td>
              <v-chip
                :color="isRunning(service) ? 'success' : undefined"
                size="small"
                variant="tonal"
                label
              >
                {{ isRunning(service) ? 'Running' : 'Stopped' }}
              </v-chip>
            </td>
            <td class="text-end">
              <template v-if="service.nomad === true">
                <v-btn
                  v-if="!isRunning(service)"
                  size="small"
                  color="success"
                  variant="text"
                  prepend-icon="mdi-play"
                  :loading="state.busyId === service.id"
                  @click="start(service)"
                >
                  Start
                </v-btn>
                <v-btn
                  v-else
                  size="small"
                  color="warning"
                  variant="text"
                  prepend-icon="mdi-stop"
                  :loading="state.busyId === service.id"
                  @click="stop(service)"
                >
                  Stop
                </v-btn>
              </template>
              <v-btn
                size="small"
                color="error"
                variant="text"
                prepend-icon="mdi-delete-outline"
                :disabled="state.busyId === service.id"
                @click="askForget(service)"
              >
                Forget
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <InstallServiceDialog v-model="state.installOpen" :install="install" />
    <ConfirmDialog
      v-model="state.forget.open"
      title="Forget service"
      :message="`Forget “${state.forget.service?.id}”? It is removed from the registry.`"
      confirm-text="Forget"
      danger
      :loading="state.forget.pending"
      :error="state.forget.error"
      @confirm="confirmForget"
    />
  </div>
</template>

<style scoped>
.control-page {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-7);
}

.control-page__card {
  border: 1px solid var(--md-color-border);
  box-shadow: var(--md-shadow-1);
}

.control-page__name {
  font-weight: var(--md-font-weight-medium);
}

.control-page__id {
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
