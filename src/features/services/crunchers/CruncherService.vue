<script setup>
import { computed, ref } from 'vue'
import CruncherTask from './CruncherTask.vue'

// One service: its badges, model choice (when it has several models) and
// tasks. Emits `run` with (task, model).
const props = defineProps({
  service: { type: Object, required: true },
  onSet: { type: Boolean, default: false },
  sourceRid: { type: String, default: '' },
  runningKey: { type: String, default: '' },
})

const emit = defineEmits(['run', 'help', 'dspace-query'])

const models = computed(() => Object.entries(props.service.models || {}))
const chosenModel = ref(models.value.length === 1 ? models.value[0][0] : null)
const tasksVisible = computed(() => models.value.length <= 1 || chosenModel.value)
const external = computed(() => props.service.location === 'external')
</script>

<template>
  <v-expansion-panel class="cruncher-service">
    <v-expansion-panel-title>
      <div class="cruncher-service__head">
        <div class="cruncher-service__title">
          <span class="cruncher-service__name">{{ service.name }}</span>
          <v-chip
            size="x-small"
            label
            :color="service.access === 'proprietary' ? 'error' : 'success'"
            variant="tonal"
          >
            {{ service.access === 'proprietary' ? 'proprietary' : 'open source' }}
          </v-chip>
          <v-chip
            size="x-small"
            label
            :color="external ? 'error' : 'success'"
            :prepend-icon="external ? 'mdi-alert-circle' : 'mdi-check-circle'"
            variant="tonal"
          >
            {{ external ? 'external' : 'on-premise' }}
          </v-chip>
          <v-chip
            v-if="service.status === 'experimental'"
            size="x-small"
            label
            color="warning"
            variant="outlined"
          >
            experimental
          </v-chip>
        </div>
        <span class="cruncher-service__description">{{ service.description }}</span>
      </div>
      <template #actions="{ expanded }">
        <v-btn
          size="small"
          variant="text"
          prepend-icon="mdi-help-circle-outline"
          class="me-1"
          @click.stop="emit('help', service.id)"
        >
          Help
        </v-btn>
        <v-btn
          v-if="service.source_url"
          :href="service.source_url"
          target="_blank"
          rel="noopener"
          size="small"
          variant="text"
          icon="mdi-open-in-new"
          aria-label="More about this service"
          @click.stop
        />
        <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" />
      </template>
    </v-expansion-panel-title>

    <v-expansion-panel-text>
      <v-alert v-if="external" type="error" variant="tonal" density="compact" class="mb-4">
        This cruncher is external and needs an API key.
        <strong>Your data will be sent to the external service.</strong>
      </v-alert>

      <div v-if="models.length > 1" class="cruncher-service__models">
        <h4 class="cruncher-service__label">Model</h4>
        <v-radio-group v-model="chosenModel" hide-details>
          <v-radio v-for="[id, model] in models" :key="id" :value="id">
            <template #label>
              <span>
                <strong>{{ model.name }}</strong> · {{ model.output }}
                <span class="cruncher-service__muted">
                  {{ model.description }} Input: {{ model.supported_types?.join(', ') || 'all' }}
                </span>
              </span>
            </template>
          </v-radio>
        </v-radio-group>
      </div>
      <p v-else-if="models.length === 1" class="cruncher-service__muted">
        Model: <strong>{{ models[0][1].name }}</strong> · {{ models[0][1].output }}
      </p>

      <v-expansion-panels v-if="tasksVisible" variant="accordion">
        <v-expansion-panel v-for="task in service.tasks" :key="task.key">
          <v-expansion-panel-title>
            <span class="cruncher-service__task">{{ task.name }}</span>
            <span class="cruncher-service__muted ms-2">{{ task.description }}</span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <CruncherTask
              :service="service"
              :task="task"
              :on-set="onSet"
              :source-rid="sourceRid"
              :running="runningKey === `${service.id}:${task.key}`"
              @run="emit('run', task, chosenModel)"
              @dspace-query="emit('dspace-query', $event)"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
      <p v-else class="cruncher-service__muted">Choose a model to see its tasks.</p>
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<style scoped>
.cruncher-service__head {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-1);
}

.cruncher-service__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-space-2);
}

.cruncher-service__name {
  font-weight: var(--md-font-weight-bold);
}

.cruncher-service__description,
.cruncher-service__muted {
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.cruncher-service__muted {
  display: block;
}

.cruncher-service__label {
  margin: 0 0 var(--md-space-1);
  font-family: var(--md-font-body) !important;
  font-size: var(--md-font-size-sm);
}

.cruncher-service__models {
  margin-block-end: var(--md-space-4);
}

.cruncher-service__task {
  font-weight: var(--md-font-weight-medium);
}
</style>
