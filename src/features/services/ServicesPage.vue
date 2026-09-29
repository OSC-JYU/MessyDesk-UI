<script setup>
import { computed, onMounted, reactive } from 'vue'
import { cancelJob, flushQueue, getActiveJobs, getServices } from '@/api/services.js'
import { session } from '@/stores/session.js'
import PageHeader from '@/ui/PageHeader.vue'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import QueueDialog from './QueueDialog.vue'
import { usePolling } from './usePolling.js'
import {
  EMPTY_LOAD,
  isRunning,
  lastSeenLabel,
  loadByService,
  serviceLocation,
  supportedTypes,
  supportsType,
  toServiceList,
} from './serviceStatus.js'

// Monitor of the processing services: health, location and queue load.
const state = reactive({
  services: [],
  jobs: [],
  filterType: null,
  loading: true,
  refreshing: false,
  updatedAt: null,
  error: null,
  queueService: null,
  queueOpen: false,
})

const load = computed(() => loadByService(state.jobs))
const types = computed(() => supportedTypes(state.services))
const visible = computed(() => state.services.filter((s) => supportsType(s, state.filterType)))
const runningCount = computed(() => state.services.filter(isRunning).length)
const serviceLoad = (service) => load.value[service.id] || EMPTY_LOAD

async function refresh() {
  if (state.refreshing) return
  state.refreshing = true
  try {
    const [registry, jobs] = await Promise.all([getServices(), getActiveJobs().catch(() => [])])
    state.services = toServiceList(registry)
    state.jobs = Array.isArray(jobs) ? jobs : []
    state.updatedAt = new Date()
    state.error = null
  } catch (error) {
    state.error = error
  } finally {
    state.refreshing = false
    state.loading = false
  }
}

const polling = usePolling(refresh, 5000)

function openQueue(service) {
  state.queueService = service
  state.queueOpen = true
}

async function act(action) {
  try {
    await action()
    state.jobs = (await getActiveJobs()) || []
  } catch (error) {
    state.error = error
  }
}

onMounted(async () => {
  await refresh()
  polling.start()
})
</script>

<template>
  <div class="services-page">
    <PageHeader title="Services">
      <template #subtitle>
        {{ runningCount }} of {{ state.services.length }} services running.
        <span v-if="state.updatedAt">Updated {{ state.updatedAt.toLocaleTimeString() }}.</span>
      </template>
      <template #actions>
        <v-btn
          :color="polling.live.value ? 'success' : undefined"
          size="small"
          variant="tonal"
          :prepend-icon="polling.live.value ? 'mdi-autorenew' : 'mdi-autorenew-off'"
          :aria-pressed="polling.live.value"
          @click="polling.toggle"
        >
          {{ polling.live.value ? 'Live' : 'Paused' }}
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          icon="mdi-refresh"
          aria-label="Refresh now"
          :loading="state.refreshing"
          @click="refresh"
        />
        <v-btn
          v-if="session.isAdmin"
          color="primary"
          size="small"
          variant="flat"
          prepend-icon="mdi-cog"
          :to="{ name: 'services-admin' }"
        >
          Control
        </v-btn>
      </template>
    </PageHeader>

    <v-select
      v-model="state.filterType"
      :items="types"
      label="Filter by supported type"
      clearable
      prepend-inner-icon="mdi-filter-variant"
      variant="outlined"
      density="compact"
      hide-details
      class="services-page__filter"
    />

    <ErrorAlert :error="state.error" title="Could not load services" class="mb-4" />

    <LoadingState v-if="state.loading" text="Loading services…" />
    <v-card v-else rounded="lg" flat class="services-page__card">
      <EmptyState
        v-if="!visible.length"
        icon="mdi-cogs"
        :title="state.filterType ? `No services for ${state.filterType}` : 'No services registered'"
      />
      <v-table v-else density="comfortable">
        <thead>
          <tr>
            <th>Service</th>
            <th>Health</th>
            <th>Location</th>
            <th class="text-center">Consumers</th>
            <th>Queue load</th>
            <th>Last seen</th>
            <th><span class="services-page__sr">Queue</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in visible" :key="service.id">
            <td>
              <div class="services-page__name">{{ service.name || service.id }}</div>
              <div class="services-page__id">{{ service.id }}</div>
            </td>
            <td>
              <v-chip
                :color="isRunning(service) ? 'success' : undefined"
                :prepend-icon="isRunning(service) ? 'mdi-circle' : 'mdi-circle-outline'"
                size="small"
                variant="tonal"
                label
              >
                {{ isRunning(service) ? 'Running' : 'Stopped' }}
              </v-chip>
            </td>
            <td>
              <v-chip size="x-small" variant="outlined" label>{{
                serviceLocation(service)
              }}</v-chip>
            </td>
            <td class="text-center">{{ (service.consumers || []).length }}</td>
            <td>
              <div class="services-page__load">
                <v-chip
                  v-if="serviceLoad(service).running"
                  size="x-small"
                  color="primary"
                  variant="tonal"
                  label
                >
                  {{ serviceLoad(service).running }} running
                </v-chip>
                <v-chip
                  v-if="serviceLoad(service).queued"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  label
                >
                  {{ serviceLoad(service).queued }} queued
                </v-chip>
                <span v-if="!serviceLoad(service).total" class="services-page__idle">idle</span>
              </div>
            </td>
            <td class="services-page__seen">{{ lastSeenLabel(service) }}</td>
            <td class="text-end">
              <v-btn
                size="small"
                variant="text"
                icon="mdi-format-list-bulleted"
                :aria-label="`Queue of ${service.name || service.id}`"
                :disabled="!serviceLoad(service).total"
                @click="openQueue(service)"
              />
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <QueueDialog
      v-model="state.queueOpen"
      :service="state.queueService"
      :jobs="state.queueService ? serviceLoad(state.queueService).jobs : []"
      @cancel-job="(job) => act(() => cancelJob(job.rid))"
      @flush="(service) => act(() => flushQueue(service.id))"
    />
  </div>
</template>

<style scoped>
.services-page {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-7);
}

.services-page__filter {
  max-width: var(--md-card-min-width);
  margin-block-end: var(--md-space-4);
}

.services-page__card {
  border: 1px solid var(--md-color-border);
  box-shadow: var(--md-shadow-1);
}

.services-page__name {
  font-weight: var(--md-font-weight-medium);
}

.services-page__id {
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.services-page__load {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
}

.services-page__idle,
.services-page__seen {
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.services-page__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
</style>
