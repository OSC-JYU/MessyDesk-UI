<style scoped>
em {
  font-style: normal;
  font-weight: bold;
  color: red important;  
}

.column_text2 {
  height: 100%;
  overflow-y: scroll;
}

.service-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.chip-flat {
  size: 10px;
}

.v-main {
  overflow-y: auto !important;
}

.v-layout {
  height: 100vh;
  overflow: hidden;
}
</style>

<script setup>
    import JYUHeader_plain from './JYUHeader_plain.vue'
    import ServicesDetails from './ServicesDetails.vue'
    import web from "../web.js";
    
    import { onMounted, reactive, computed} from "vue";
    import { useRoute, useRouter } from 'vue-router'
    import axios from "axios";

    const route = useRoute();
    const router = useRouter();

    document.title = "MessyDesk - Services"

    var state = reactive({
        services: [],
        filterType: null,
        loading: false,
        queueDialog: false,
        queueData: {},
        currentTopic: "",
        selectedService: null,
        detailsDialog: false
    })

    // Get all unique supported types for filter
    const supportedTypes = computed(() => {
        const types = new Set()
        state.services.forEach(service => {
            if(service.supported_types && Array.isArray(service.supported_types)) {
                service.supported_types.forEach(type => types.add(type))
            }
            if(service.supported_formats && Array.isArray(service.supported_formats)) {
                service.supported_formats.forEach(format => types.add(format))
            }
        })
        return Array.from(types).sort()
    })

    // Filter services based on selected type
    const filteredServices = computed(() => {
        if(!state.filterType) {
            return state.services
        }
        return state.services.filter(service => {
            const hasType = service.supported_types && service.supported_types.includes(state.filterType)
            const hasFormat = service.supported_formats && service.supported_formats.includes(state.filterType)
            return hasType || hasFormat
        })
    })

    // Check if service is running (has active consumers)
    const isServiceRunning = (service) => {
        return service.consumers && service.consumers.length > 0
    }

    // Get nomad status - positive if service has nomad enabled
    const getNomadStatus = (service) => {
        return service.nomad === true
    }

    const loadServices = async () => {
        state.loading = true
        try {
            const response = await web.getServices()
            state.services = []
            for(const key in response) {
                const service = response[key]
                service.id = key
                service.active = isServiceRunning(service)
                state.services.push(service)
            }
        } catch (error) {
            console.error('Error loading services:', error)
        } finally {
            state.loading = false
        }
    }

    const startService = async (service) => {
        try {
            await axios.post(`/api/nomad/service/${service.id}`)
            // Reload services to update status
            await loadServices()
        } catch (error) {
            console.error('Error starting service:', error)
            alert('Failed to start service: ' + (error.response?.data?.error || error.message))
        }
    }

    const stopService = async (service) => {
        try {
            await axios.delete(`/api/nomad/service/${service.id}`)
            // Reload services to update status
            await loadServices()
        } catch (error) {
            console.error('Error stopping service:', error)
            alert('Failed to stop service: ' + (error.response?.data?.error || error.message))
        }
    }

    const openServiceDetail = (service) => {
        state.selectedService = service
        state.detailsDialog = true
    }

    const onServiceUpdated = async () => {
        // Reload services when service is started/stopped
        await loadServices()
    }

    const open_queue = async (topic) => {
        try {
            const response = await fetch(`http://localhost:8200/api/queue/${topic}/status`)
            const data = await response.json()
            state.queueData = data
            state.currentTopic = topic
            state.queueDialog = true
        } catch (error) {
            console.error('Error fetching queue status:', error)
        }
    }

    onMounted(async() => {
        await loadServices()
    })

</script>

<template>
    <v-layout class="fill-height">
        <JYUHeader_plain/>
        
        <v-main class="fill-height">
            <v-container>
                    <v-row>
                        <v-col cols="12">
                            <h1 class="text-h4 mb-4">Service Control</h1>
                            <p class="text-body-1 mb-4">
                                Find and install services. Services are listed from MessyDesk/services directory.
                            </p>
                        </v-col>
                    </v-row>

                    <!-- Filter by supported types -->
                    <v-row>
                        <v-col cols="12" md="4">
                            <v-select
                                v-model="state.filterType"
                                :items="supportedTypes"
                                label="Filter by supported type"
                                clearable
                                prepend-inner-icon="mdi-filter"
                                variant="outlined"
                                density="comfortable"
                            ></v-select>
                        </v-col>
                    </v-row>

                    <!-- Services Grid -->
                    <v-row v-if="!state.loading">
                        <v-col 
                            v-for="service in filteredServices" 
                            :key="service.id"
                            cols="12"
                            sm="6"
                            md="4"
                            lg="3"
                        >
                            <v-card 
                                class="service-card h-100"
                                @click="openServiceDetail(service)"
                                variant="outlined"
                            >
                                <v-card-title class="d-flex align-center">
                                    <div class="flex-grow-1">
                                        <div class="text-h6">{{ service.name }}</div>
                                        <div class="text-caption text-medium-emphasis">{{ service.id }}</div>
                                    </div>
                                </v-card-title>

                                <v-card-text>
                                    <p class="text-body-2 mb-3">{{ service.description || 'No description available' }}</p>
                                    
                                    <!-- Status, Access, Location chips -->
                                    <div class="d-flex flex-wrap gap-2 mb-3">
                                        <!-- Status chip -->
                                        <v-chip 
                                            :color="service.status === 'experimental' ? 'error' : 'success'" 
                                            :prepend-icon="service.status === 'experimental' ? 'mdi-alert-circle' : 'mdi-check-circle'" 
                                            size="small" 
                                            variant="outlined"
                                        >
                                            {{ service.status === 'experimental' ? 'experimental' : (service.status || 'stable') }}
                                        </v-chip>

                                        <!-- Access chip -->
                                        <v-chip 
                                            :color="service.access === 'proprietary' ? 'error' : 'success'" 
                                            size="small" 
                                            variant="tonal"
                                        >
                                            {{ service.access === 'proprietary' ? 'proprietary' : (service.access || 'open source') }}
                                        </v-chip>

                                        <!-- Location chip -->
                                        <v-chip 
                                            :color="service.location === 'external' ? 'error' : 'success'" 
                                            :prepend-icon="service.location === 'external' ? 'mdi-alert-circle' : 'mdi-check-circle'" 
                                            size="small" 
                                            variant="flat"
                                        >
                                            {{ service.location === 'external' ? 'external' : (service.location || 'on-premise') }}
                                        </v-chip>
                                    </div>

                                    <!-- Nomad status indicator -->
                                    <div v-if="getNomadStatus(service)" class="mb-2">
                                        <v-chip 
                                            :color="isServiceRunning(service) ? 'success' : 'grey'" 
                                            size="small" 
                                            variant="tonal"
                                        >
                                            <v-icon start :icon="isServiceRunning(service) ? 'mdi-play-circle' : 'mdi-stop-circle'"></v-icon>
                                            {{ isServiceRunning(service) ? 'Running' : 'Stopped' }}
                                        </v-chip>
                                    </div>

                                    <!-- Supported types -->
                                    <div v-if="service.supported_types && service.supported_types.length > 0" class="text-caption text-medium-emphasis mb-2">
                                        Types: {{ service.supported_types.join(', ') }}
                                    </div>
                                    <div v-if="service.supported_formats && service.supported_formats.length > 0" class="text-caption text-medium-emphasis">
                                        Formats: {{ service.supported_formats.join(', ') }}
                                    </div>
                                </v-card-text>

                                <v-card-actions v-if="getNomadStatus(service)">
                                    <v-spacer></v-spacer>
                                    <v-btn
                                        v-if="!isServiceRunning(service)"
                                        color="success"
                                        size="small"
                                        variant="flat"
                                        prepend-icon="mdi-play"
                                        @click.stop="startService(service)"
                                    >
                                        Start
                                    </v-btn>
                                    <v-btn
                                        v-else
                                        color="error"
                                        size="small"
                                        variant="flat"
                                        prepend-icon="mdi-stop"
                                        @click.stop="stopService(service)"
                                    >
                                        Stop
                                    </v-btn>
                                </v-card-actions>
                            </v-card>
                        </v-col>
                    </v-row>

                    <!-- Loading state -->
                    <v-row v-if="state.loading">
                        <v-col cols="12" class="text-center">
                            <v-progress-circular indeterminate color="primary"></v-progress-circular>
                        </v-col>
                    </v-row>

                    <!-- No services found -->
                    <v-row v-if="!state.loading && filteredServices.length === 0">
                        <v-col cols="12" class="text-center">
                            <v-alert type="info" variant="tonal">
                                No services found{{ state.filterType ? ` matching type: ${state.filterType}` : '' }}
                            </v-alert>
                        </v-col>
                    </v-row>
                </v-container>
            </v-main>
        </v-layout>

    <!-- Service Details Dialog -->
    <ServicesDetails 
        v-model="state.detailsDialog"
        :service="state.selectedService"
        @service-updated="onServiceUpdated"
    />

    <!-- Queue Status Dialog -->
    <v-dialog v-model="state.queueDialog" max-width="600px">
        <v-card>
            <v-card-title class="text-h5">
                Queue Status: {{ state.currentTopic }}
            </v-card-title>
            <v-card-text>
                <v-container>
                    <div v-for="(queueInfo, queueName) in state.queueData" :key="queueName" class="mb-4">
                        <v-card variant="outlined" class="pa-3">
                            <v-card-title class="text-h6">{{ queueName }}</v-card-title>
                            <v-card-text>
                                <v-row>
                                    <v-col cols="6">
                                        <div class="text-subtitle-2">Delivered:</div>
                                        <div class="text-body-1">{{ queueInfo.delivered.consumer_seq || 0 }}</div>
                                    </v-col>
                                    <v-col cols="6">
                                        <div class="text-subtitle-2">Waiting:</div>
                                        <div class="text-body-1">{{ queueInfo.num_ack_pending || 0 }}</div>
                                    </v-col>
                                </v-row>
                            </v-card-text>
                        </v-card>
                    </div>
                </v-container>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="state.queueDialog = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>



