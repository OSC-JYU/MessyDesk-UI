<style scoped>
.v-main {
  overflow-y: auto !important;
}

.v-layout {
  height: 100vh;
  overflow: hidden;
}

.mono textarea {
  font-family: monospace;
  font-size: 0.85rem;
}
</style>

<script setup>
    import JYUHeader_plain from './JYUHeader_plain.vue'
    import web from "../web.js";
    import { store } from "./Store.js";

    import { onMounted, reactive, computed } from "vue";
    import { useRouter } from 'vue-router'

    const router = useRouter();

    document.title = "MessyDesk - Service Control"

    const emptyForm = () => ({
        kind: 'nomad',
        id: '',
        name: '',
        description: '',
        nomad_hcl: '',
        url: '',
        dev_url: '',
        service_json: '',
    })

    const state = reactive({
        services: [],
        loading: false,
        authorized: false,
        error: null,
        notice: null,
        installDialog: false,
        installing: false,
        busyId: null,
        form: emptyForm(),
    })

    const isAdmin = computed(() => store.user && store.user.access === 'admin')

    async function loadServices() {
        state.loading = true
        state.error = null
        try {
            const response = await web.getServices()
            const list = []
            for (const key in response) {
                const service = response[key]
                service.id = service.id || key
                list.push(service)
            }
            list.sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id))
            state.services = list
        } catch (e) {
            state.error = e.message || 'Failed to load services'
        } finally {
            state.loading = false
        }
    }

    function isRunning(service) {
        return Array.isArray(service.consumers) && service.consumers.length > 0
    }

    function canNomad(service) {
        return service.nomad === true
    }

    async function startService(service) {
        state.busyId = service.id
        state.error = null
        try {
            await web.startService(service.id, service.nomad_hcl)
            state.notice = `Started ${service.id}`
            await loadServices()
        } catch (e) {
            state.error = `Failed to start ${service.id}: ${e.message || e}`
        } finally {
            state.busyId = null
        }
    }

    async function stopService(service) {
        state.busyId = service.id
        state.error = null
        try {
            await web.stopService(service.id)
            state.notice = `Stopped ${service.id}`
            await loadServices()
        } catch (e) {
            state.error = `Failed to stop ${service.id}: ${e.message || e}`
        } finally {
            state.busyId = null
        }
    }

    async function forgetService(service) {
        if (!confirm(`Forget service "${service.id}"? It will be removed from the registry.`)) return
        state.busyId = service.id
        state.error = null
        try {
            const result = await web.forgetService(service.id)
            if (result && result.status === 'not_found') {
                state.error = `Service ${service.id} was not found in the registry.`
            } else {
                state.notice = `Forgot ${service.id}`
            }
            await loadServices()
        } catch (e) {
            state.error = `Failed to forget ${service.id}: ${e.message || e}`
        } finally {
            state.busyId = null
        }
    }

    async function reloadServices() {
        state.error = null
        try {
            await web.reloadServices()
            state.notice = 'Reloaded services from disk'
            await loadServices()
        } catch (e) {
            state.error = `Failed to reload: ${e.message || e}`
        }
    }

    function openInstall() {
        state.form = emptyForm()
        state.installDialog = true
    }

    async function readFileInto(event, field) {
        const file = event && event.target && event.target.files && event.target.files[0]
        if (!file) return
        state.form[field] = await file.text()
    }

    function buildPayload() {
        const form = state.form
        const payload = { kind: form.kind, id: form.id.trim() }
        if (form.name.trim()) payload.name = form.name.trim()
        if (form.description.trim()) payload.description = form.description.trim()
        if (form.service_json.trim()) payload.service = form.service_json.trim()
        if (form.kind === 'nomad') payload.nomad_hcl = form.nomad_hcl
        if (form.kind === 'external') payload.url = form.url.trim()
        if (form.kind === 'local') payload.dev_url = form.dev_url.trim()
        return payload
    }

    async function installService() {
        state.installing = true
        state.error = null
        try {
            await web.installService(buildPayload())
            state.notice = `Installed ${state.form.id}`
            state.installDialog = false
            await loadServices()
        } catch (e) {
            state.error = e.message || 'Failed to install service'
        } finally {
            state.installing = false
        }
    }

    onMounted(async () => {
        if (!store.user) {
            try { store.user = await web.getMe() } catch (e) { /* ignore */ }
        }
        if (!isAdmin.value) {
            router.replace({ name: 'services' })
            return
        }
        state.authorized = true
        await loadServices()
    })
</script>

<template>
    <v-layout class="fill-height">
        <JYUHeader_plain/>

        <v-main class="fill-height">
            <v-container v-if="state.authorized">
                <v-row align="center">
                    <v-col cols="12" md="8">
                        <h1 class="text-h4 mb-1">Service Control</h1>
                        <p class="text-body-2 text-medium-emphasis mb-0">
                            Install, start, stop and forget services. Admin only.
                        </p>
                    </v-col>
                    <v-col cols="12" md="4" class="d-flex justify-end align-center flex-wrap gap-2">
                        <v-btn size="small" variant="text" prepend-icon="mdi-view-dashboard" @click="router.push({ name: 'services' })">
                            Monitor
                        </v-btn>
                        <v-btn size="small" variant="tonal" prepend-icon="mdi-reload" @click="reloadServices">
                            Reload
                        </v-btn>
                        <v-btn color="primary" size="small" variant="flat" prepend-icon="mdi-plus" @click="openInstall">
                            Install
                        </v-btn>
                    </v-col>
                </v-row>

                <v-alert v-if="state.error" type="error" variant="tonal" class="my-3" closable @click:close="state.error = null">
                    {{ state.error }}
                </v-alert>
                <v-alert v-if="state.notice" type="success" variant="tonal" class="my-3" closable @click:close="state.notice = null">
                    {{ state.notice }}
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
                                <th>Source</th>
                                <th>Status</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="service in state.services" :key="service.id">
                                <td>
                                    <div class="text-body-1 font-weight-medium">{{ service.name || service.id }}</div>
                                    <div class="text-caption text-medium-emphasis">{{ service.id }}</div>
                                </td>
                                <td>
                                    <v-chip size="x-small" variant="outlined">
                                        {{ service.kind || (service.nomad ? 'nomad' : (service.registration && service.registration.source) || 'disk') }}
                                    </v-chip>
                                </td>
                                <td>
                                    <v-chip :color="isRunning(service) ? 'success' : 'grey'" size="small" variant="tonal">
                                        {{ isRunning(service) ? 'Running' : 'Stopped' }}
                                    </v-chip>
                                </td>
                                <td class="text-right">
                                    <v-btn
                                        v-if="canNomad(service) && !isRunning(service)"
                                        size="small"
                                        color="success"
                                        variant="text"
                                        prepend-icon="mdi-play"
                                        :loading="state.busyId === service.id"
                                        @click="startService(service)"
                                    >Start</v-btn>
                                    <v-btn
                                        v-if="canNomad(service) && isRunning(service)"
                                        size="small"
                                        color="warning"
                                        variant="text"
                                        prepend-icon="mdi-stop"
                                        :loading="state.busyId === service.id"
                                        @click="stopService(service)"
                                    >Stop</v-btn>
                                    <v-btn
                                        size="small"
                                        color="error"
                                        variant="text"
                                        prepend-icon="mdi-delete"
                                        :loading="state.busyId === service.id"
                                        @click="forgetService(service)"
                                    >Forget</v-btn>
                                </td>
                            </tr>
                            <tr v-if="state.services.length === 0">
                                <td colspan="4" class="text-center text-medium-emphasis py-6">No services registered.</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card>
            </v-container>
        </v-main>
    </v-layout>

    <!-- Install dialog -->
    <v-dialog v-model="state.installDialog" max-width="760px" scrollable>
        <v-card>
            <v-card-title>Install service</v-card-title>
            <v-card-text>
                <v-tabs v-model="state.form.kind" color="primary" class="mb-4">
                    <v-tab value="nomad">Nomad</v-tab>
                    <v-tab value="external">External URL</v-tab>
                    <v-tab value="local">Local URL</v-tab>
                </v-tabs>

                <v-text-field
                    v-model="state.form.id"
                    label="Service id (queue topic)"
                    hint="e.g. md-trocr"
                    variant="outlined"
                    density="compact"
                ></v-text-field>
                <v-text-field
                    v-model="state.form.name"
                    label="Display name (optional)"
                    variant="outlined"
                    density="compact"
                ></v-text-field>
                <v-textarea
                    v-model="state.form.description"
                    label="Description (optional)"
                    variant="outlined"
                    density="compact"
                    rows="2"
                ></v-textarea>

                <!-- Nomad -->
                <template v-if="state.form.kind === 'nomad'">
                    <p class="text-caption text-medium-emphasis mb-2">
                        Paste a nomad.hcl spec or upload a file. MessyDesk deploys it via Nomad.
                    </p>
                    <v-file-input
                        label="Upload nomad.hcl"
                        accept=".hcl,.nomad,text/plain"
                        variant="outlined"
                        density="compact"
                        prepend-icon="mdi-file-upload"
                        @change="(e) => readFileInto(e, 'nomad_hcl')"
                    ></v-file-input>
                    <v-textarea
                        v-model="state.form.nomad_hcl"
                        label="nomad.hcl"
                        class="mono"
                        variant="outlined"
                        density="compact"
                        rows="8"
                    ></v-textarea>
                </template>

                <!-- External -->
                <template v-else-if="state.form.kind === 'external'">
                    <p class="text-caption text-medium-emphasis mb-2">
                        External service reachable over HTTP. Provide its URL and optionally a service.json descriptor.
                    </p>
                    <v-text-field
                        v-model="state.form.url"
                        label="Service URL"
                        hint="https://example.org/service"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                    <v-file-input
                        label="Upload service.json (optional)"
                        accept=".json,application/json"
                        variant="outlined"
                        density="compact"
                        prepend-icon="mdi-file-upload"
                        @change="(e) => readFileInto(e, 'service_json')"
                    ></v-file-input>
                    <v-textarea
                        v-model="state.form.service_json"
                        label="service.json (optional)"
                        class="mono"
                        variant="outlined"
                        density="compact"
                        rows="6"
                    ></v-textarea>
                </template>

                <!-- Local -->
                <template v-else>
                    <p class="text-caption text-medium-emphasis mb-2">
                        Local development service. Provide the DEV_URL where the service is running.
                    </p>
                    <v-text-field
                        v-model="state.form.dev_url"
                        label="DEV_URL"
                        hint="http://localhost:9012"
                        variant="outlined"
                        density="compact"
                    ></v-text-field>
                    <v-file-input
                        label="Upload service.json (optional)"
                        accept=".json,application/json"
                        variant="outlined"
                        density="compact"
                        prepend-icon="mdi-file-upload"
                        @change="(e) => readFileInto(e, 'service_json')"
                    ></v-file-input>
                    <v-textarea
                        v-model="state.form.service_json"
                        label="service.json (optional)"
                        class="mono"
                        variant="outlined"
                        density="compact"
                        rows="6"
                    ></v-textarea>
                </template>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="state.installDialog = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" :loading="state.installing" @click="installService">Install</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
