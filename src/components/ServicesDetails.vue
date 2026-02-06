<style scoped>
.chip-flat {
  size: 10px;
}

.task-card {
  margin-bottom: 16px;
}
</style>

<script setup>
    import { computed } from "vue";
    import axios from "axios";
    import web from "../web.js";

    const props = defineProps({
        service: {
            type: Object,
            required: true
        },
        modelValue: {
            type: Boolean,
            default: false
        }
    })

    const emit = defineEmits(['update:modelValue', 'service-updated'])

    // Check if service is running (has active consumers)
    const isServiceRunning = computed(() => {
        return props.service.consumers && props.service.consumers.length > 0
    })

    // Get nomad status - positive if service has nomad enabled
    const getNomadStatus = computed(() => {
        return props.service.nomad === true
    })

    // Get all tasks from the service
    const serviceTasks = computed(() => {
        if (!props.service.tasks) return []
        return Object.entries(props.service.tasks).map(([key, task]) => ({
            id: key,
            ...task
        }))
    })

    const startService = async () => {
        try {
            await axios.post(`/api/nomad/service/${props.service.id}`)
            emit('service-updated')
        } catch (error) {
            console.error('Error starting service:', error)
            alert('Failed to start service: ' + (error.response?.data?.error || error.message))
        }
    }

    const stopService = async () => {
        try {
            await axios.delete(`/api/nomad/service/${props.service.id}`)
            emit('service-updated')
        } catch (error) {
            console.error('Error stopping service:', error)
            alert('Failed to stop service: ' + (error.response?.data?.error || error.message))
        }
    }

    const closeDialog = () => {
        emit('update:modelValue', false)
    }
</script>

<template>
    <v-dialog 
        :model-value="modelValue" 
        @update:model-value="emit('update:modelValue', $event)"
        max-width="800px"
        scrollable
    >
        <v-card v-if="service">
            <v-card-title class="d-flex align-center">
                <div class="flex-grow-1">
                    <div class="text-h5">{{ service.name }}</div>
                    <div class="text-caption text-medium-emphasis">{{ service.id }}</div>
                </div>
                <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
            </v-card-title>

            <v-divider></v-divider>

            <v-card-text>
                <!-- Service Description -->
                <div class="mb-4">
                    <p class="text-body-1">{{ service.description || 'No description available' }}</p>
                </div>

                <!-- Status, Access, Location chips -->
                <div class="d-flex flex-wrap gap-2 mb-4">
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

                <!-- Nomad Status and Controls -->
                <v-card v-if="getNomadStatus" variant="outlined" class="mb-4">
                    <v-card-title class="text-subtitle-1">
                        <v-icon start icon="mdi-server"></v-icon>
                        Nomad Service Status
                    </v-card-title>
                    <v-card-text>
                        <div class="d-flex align-center mb-3">
                            <v-chip 
                                :color="isServiceRunning ? 'success' : 'grey'" 
                                size="small" 
                                variant="tonal"
                                class="mr-3"
                            >
                                <v-icon start :icon="isServiceRunning ? 'mdi-play-circle' : 'mdi-stop-circle'"></v-icon>
                                {{ isServiceRunning ? 'Running' : 'Stopped' }}
                            </v-chip>
                            
                            <v-spacer></v-spacer>
                            
                            <v-btn
                                v-if="!isServiceRunning"
                                color="success"
                                size="small"
                                variant="flat"
                                prepend-icon="mdi-play"
                                @click="startService"
                            >
                                Start Service
                            </v-btn>
                            <v-btn
                                v-else
                                color="error"
                                size="small"
                                variant="flat"
                                prepend-icon="mdi-stop"
                                @click="stopService"
                            >
                                Stop Service
                            </v-btn>
                        </div>
                    </v-card-text>
                </v-card>

                <!-- Service Information -->
                <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-subtitle-1">
                        <v-icon start icon="mdi-information"></v-icon>
                        Service Information
                    </v-card-title>
                    <v-card-text>
                        <v-list density="compact">
                            <v-list-item v-if="service.local_url">
                                <v-list-item-title>Local URL</v-list-item-title>
                                <v-list-item-subtitle>{{ service.local_url }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="service.url">
                                <v-list-item-title>Service URL</v-list-item-title>
                                <v-list-item-subtitle>{{ service.url }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="service.source_url">
                                <v-list-item-title>Source URL</v-list-item-title>
                                <v-list-item-subtitle>
                                    <a :href="service.source_url" target="_blank" class="text-decoration-none">
                                        {{ service.source_url }}
                                        <v-icon size="small" icon="mdi-open-in-new"></v-icon>
                                    </a>
                                </v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="service.supported_types && service.supported_types.length > 0">
                                <v-list-item-title>Supported Types</v-list-item-title>
                                <v-list-item-subtitle>{{ service.supported_types.join(', ') }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="service.supported_formats && service.supported_formats.length > 0">
                                <v-list-item-title>Supported Formats</v-list-item-title>
                                <v-list-item-subtitle>{{ service.supported_formats.join(', ') }}</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item v-if="service.consumers && service.consumers.length > 0">
                                <v-list-item-title>Active Consumers</v-list-item-title>
                                <v-list-item-subtitle>{{ service.consumers.length }} consumer(s)</v-list-item-subtitle>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>

                <!-- Tasks -->
                <div>
                    <h3 class="text-h6 mb-3">
                        <v-icon start icon="mdi-format-list-bulleted"></v-icon>
                        Tasks ({{ serviceTasks.length }})
                    </h3>
                    
                    <v-alert 
                        v-if="serviceTasks.length === 0" 
                        type="info" 
                        variant="tonal"
                        class="mb-4"
                    >
                        No tasks available for this service.
                    </v-alert>

                    <v-card 
                        v-for="task in serviceTasks" 
                        :key="task.id"
                        variant="outlined"
                        class="task-card"
                    >
                        <v-card-title class="text-subtitle-1">
                            {{ task.name }}
                            <v-chip 
                                v-if="task.output_type"
                                size="small" 
                                variant="tonal" 
                                class="ml-2"
                            >
                                {{ task.output_type === 'json' ? 'JSON' : 'Text' }}
                            </v-chip>
                        </v-card-title>
                        <v-card-text>
                            <p class="text-body-2 mb-2">{{ task.description || 'No description available' }}</p>
                            
                            <div v-if="task.supported_formats && task.supported_formats.length > 0" class="mb-2">
                                <strong class="text-caption">Supported formats:</strong>
                                <v-chip 
                                    v-for="format in task.supported_formats" 
                                    :key="format"
                                    size="x-small" 
                                    variant="outlined"
                                    class="ml-1"
                                >
                                    {{ format }}
                                </v-chip>
                            </div>
                            
                            <div v-if="task.supported_types && task.supported_types.length > 0" class="mb-2">
                                <strong class="text-caption">Supported types:</strong>
                                <v-chip 
                                    v-for="type in task.supported_types" 
                                    :key="type"
                                    size="x-small" 
                                    variant="outlined"
                                    class="ml-1"
                                >
                                    {{ type }}
                                </v-chip>
                            </div>

                            <div v-if="task.info" class="text-caption text-medium-emphasis mt-2">
                                <v-icon size="small" icon="mdi-information" class="mr-1"></v-icon>
                                {{ task.info }}
                            </div>
                        </v-card-text>
                    </v-card>
                </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" @click="closeDialog">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
