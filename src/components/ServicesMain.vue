<style scoped>
.v-main {
  overflow-y: auto !important;
}

.v-layout {
  height: 100vh;
  overflow: hidden;
}

.service-row td {
  vertical-align: middle;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}
</style>

<script setup>
    import web from "../web.js";
    import { store } from "./Store.js";

    import { onMounted, onUnmounted, reactive, computed } from "vue";
    import { useRouter } from 'vue-router'

    const router = useRouter();


    const POLL_INTERVAL_MS = 5000;
    let pollTimer = null;

    const state = reactive({
        services: [],
        activeJobs: [],
        filterType: null,
        loading: false,
        refreshing: false,
        autoRefresh: true,
        lastUpdated: null,
        queueDialog: false,
        selectedService: null,
        error: null,
    })

    const isAdmin = computed(() => store.user && store.user.access === 'admin')

    // All active jobs grouped by service id (topic).
    const jobsByService = computed(() => {
        const map = {}
        for (const job of state.activeJobs) {
            const id = job.service_id || (job.queue || '').replace(/_batch$/, '')
            if (!map[id]) map[id] = { queued: 0, running: 0, total: 0, jobs: [] }
            map[id].queued += Number(job.queued_files || 0)
            map[id].running += Number(job.running_files || 0)
            map[id].total += Number(job.total_files || 0)
            map[id].jobs.push(job)
        }
        return map
    })

    const supportedTypes = computed(() => {
        const types = new Set()
        state.services.forEach(service => {
            (service.supported_types || []).forEach(t => types.add(t))
            ;(service.supported_formats || []).forEach(f => types.add(f))
        })
        return Array.from(types).sort()
    })

    const filteredServices = computed(() => {
        if (!state.filterType) return state.services
        return state.services.filter(service =>
            (service.supported_types || []).includes(state.filterType) ||
            (service.supported_formats || []).includes(state.filterType)
        )
    })

    const runningCount = computed(() => state.services.filter(isRunning).length)

    function isRunning(service) {
        return Array.isArray(service.consumers) && service.consumers.length > 0
    }

    function serviceLocation(service) {
        if (service.nomad === true) return 'nomad'
        if (service.location === 'external') return 'external'
        if (service.local_url) return 'local'
        return service.location || 'unknown'
    }

    function serviceLoad(service) {
        return jobsByService.value[service.id] || { queued: 0, running: 0, total: 0, jobs: [] }
    }

    function lastSeen(service) {
        const seen = service.registration && service.registration.last_seen
        if (!seen) return null
        const d = new Date(seen)
        if (isNaN(d.getTime())) return null
        return d
    }

    function lastSeenLabel(service) {
        const d = lastSeen(service)
        if (!d) return '—'
        const secs = Math.floor((Date.now() - d.getTime()) / 1000)
        if (secs < 60) return `${secs}s ago`
        if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
        if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
        return d.toLocaleDateString()
    }

    async function loadServices() {
        const response = await web.getServices()
        const list = []
        for (const key in response) {
            const service = response[key]
            service.id = service.id || key
            list.push(service)
        }
        list.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
        state.services = list
    }

    async function loadActiveJobs() {
        try {
            const jobs = await web.getActiveJobs()
            state.activeJobs = Array.isArray(jobs) ? jobs : []
        } catch (e) {
            state.activeJobs = []
        }
    }

    async function refresh({ silent = false } = {}) {
        if (state.refreshing) return
        state.refreshing = true
        if (!silent) state.loading = true
        state.error = null
        try {
            await Promise.all([loadServices(), loadActiveJobs()])
            state.lastUpdated = new Date()
        } catch (e) {
            state.error = e.message || 'Failed to load services'
        } finally {
            state.refreshing = false
            state.loading = false
        }
    }

    function startPolling() {
        stopPolling()
        if (!state.autoRefresh) return
        pollTimer = setInterval(() => refresh({ silent: true }), POLL_INTERVAL_MS)
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
        }
    }

    function toggleAutoRefresh() {
        state.autoRefresh = !state.autoRefresh
        startPolling()
    }

    function openQueue(service) {
        state.selectedService = service
        state.queueDialog = true
    }

    const selectedJobs = computed(() => {
        if (!state.selectedService) return []
        return serviceLoad(state.selectedService).jobs
    })

    async function cancelJob(job) {
        try {
            await web.cancelJob(job.rid)
            await loadActiveJobs()
        } catch (e) {
            state.error = e.message || 'Failed to cancel job'
        }
    }

    async function flushQueue(service) {
        try {
            await web.flushQueue(service.id)
            await loadActiveJobs()
        } catch (e) {
            state.error = e.message || 'Failed to flush queue'
        }
    }

    function goToAdmin() {
        router.push({ name: 'services-admin' })
    }

    onMounted(async () => {
        if (!store.user) {
            try { store.user = await web.getMe() } catch (e) { /* ignore */ }
        }
        await refresh()
        startPolling()
    })

    onUnmounted(() => stopPolling())
</script>

<template>
    <v-layout class="fill-height">

        <v-main class="fill-height">
            <v-container>
                <v-row align="center">
                    <v-col cols="12" md="8">
                        <h1 class="text-h4 mb-1">Services</h1>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                            {{ runningCount }} of {{ state.services.length }} services running.
                            <span v-if="state.lastUpdated">Updated {{ state.lastUpdated.toLocaleTimeString() }}.</span>
                        </p>
                    </v-col>
                    <v-col cols="12" md="4" class="d-flex justify-end align-center flex-wrap gap-2">
                        <v-btn
                            :color="state.autoRefresh ? 'success' : 'grey'"
                            size="small"
                            variant="tonal"
                            :prepend-icon="state.autoRefresh ? 'mdi-autorenew' : 'mdi-autorenew-off'"
                            @click="toggleAutoRefresh"
                        >
                            {{ state.autoRefresh ? 'Live' : 'Paused' }}
                        </v-btn>
                        <v-btn
                            size="small"
                            variant="text"
                            icon="mdi-refresh"
                            :loading="state.refreshing"
                            @click="refresh()"
                        ></v-btn>
                        <v-btn
                            v-if="isAdmin"
                            color="primary"
                            size="small"
                            variant="flat"
                            prepend-icon="mdi-cog"
                            @click="goToAdmin"
                        >
                            Control
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row>
                    <v-col cols="12" md="4">
                        <v-select
                            v-model="state.filterType"
                            :items="supportedTypes"
                            label="Filter by supported type"
                            clearable
                            prepend-inner-icon="mdi-filter"
                            variant="outlined"
                            density="compact"
                            hide-details
                        ></v-select>
                    </v-col>
                </v-row>

                <v-alert v-if="state.error" type="error" variant="tonal" class="my-3" closable @click:close="state.error = null">
                    {{ state.error }}
                </v-alert>

                <v-row v-if="state.loading" class="mt-4">
                    <v-col cols="12" class="text-center">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    </v-col>
                </v-row>

                <v-card v-else variant="outlined" class="mt-2">
                    <v-table density="comfortable">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Health</th>
                                <th>Location</th>
                                <th class="text-center">Consumers</th>
                                <th>Queue load</th>
                                <th>Last seen</th>
                                <th class="text-right">Queue</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="service in filteredServices" :key="service.id" class="service-row">
                                <td>
                                    <div class="text-body-1 font-weight-medium">{{ service.name || service.id }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ service.id }}</div>
                                </td>
                                <td>
                                    <v-chip
                                        :color="isRunning(service) ? 'success' : 'grey'"
                                        size="small"
                                        variant="tonal"
                                    >
                                        <span class="dot" :style="{ backgroundColor: isRunning(service) ? '#4caf50' : '#9e9e9e' }"></span>
                                        {{ isRunning(service) ? 'Running' : 'Stopped' }}
                                    </v-chip>
                                </td>
                                <td>
                                    <v-chip size="x-small" variant="outlined">{{ serviceLocation(service) }}</v-chip>
                                </td>
                                <td class="text-center">{{ (service.consumers || []).length }}</td>
                                <td>
                                    <div class="d-flex gap-1 flex-wrap">
                                        <v-chip size="x-small" color="primary" variant="tonal" v-if="serviceLoad(service).running">
                                            {{ serviceLoad(service).running }} running
                                        </v-chip>
                                        <v-chip size="x-small" color="orange" variant="tonal" v-if="serviceLoad(service).queued">
                                            {{ serviceLoad(service).queued }} queued
                                        </v-chip>
                                        <span class="text-caption text-medium-emphasis" v-if="!serviceLoad(service).total">idle</span>
                                    </div>
                                </td>
                                <td class="text-caption">{{ lastSeenLabel(service) }}</td>
                                <td class="text-right">
                                    <v-btn
                                        size="small"
                                        variant="text"
                                        icon="mdi-format-list-bulleted"
                                        :disabled="!serviceLoad(service).total"
                                        @click="openQueue(service)"
                                    ></v-btn>
                                </td>
                            </tr>
                            <tr v-if="filteredServices.length === 0">
                                <td colspan="7" class="text-center text-medium-emphasis py-6">
                                    No services found{{ state.filterType ? ` matching type: ${state.filterType}` : '' }}
                                </td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-container>
        </v-main>
    </v-layout>

    <!-- Queue detail dialog -->
    <v-dialog v-model="state.queueDialog" max-width="720px">
        <v-card v-if="state.selectedService">
            <v-card-title class="d-flex align-center">
                <div class="flex-grow-1">
                    <div class="text-h6">{{ state.selectedService.name || state.selectedService.id }}</div>
                    <div class="text-caption text-medium-emphasis">Active queue jobs</div>
                </div>
                <v-btn
                    color="error"
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-broom"
                    @click="flushQueue(state.selectedService)"
                >
                    Flush queued
                </v-btn>
            </v-card-title>
            <v-card-text>
                <v-table density="compact" v-if="selectedJobs.length">
                    <thead>
                        <tr>
                            <th>Job / Batch</th>
                            <th class="text-center">Queued</th>
                            <th class="text-center">Running</th>
                            <th class="text-center">Total</th>
                            <th class="text-right">Cancel</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="job in selectedJobs" :key="job.rid">
                            <td class="text-caption">{{ job.rid }}</td>
                            <td class="text-center">{{ job.queued_files || 0 }}</td>
                            <td class="text-center">{{ job.running_files || 0 }}</td>
                            <td class="text-center">{{ job.total_files || 0 }}</td>
                            <td class="text-right">
                                <v-btn size="x-small" color="error" variant="text" icon="mdi-close" @click="cancelJob(job)"></v-btn>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
                <v-alert v-else type="info" variant="tonal" density="compact">No active jobs.</v-alert>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="state.queueDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
