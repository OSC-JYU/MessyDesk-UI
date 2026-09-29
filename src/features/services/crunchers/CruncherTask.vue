<script setup>
import ParamField from './ParamField.vue'

// Parameters and run button of one task.
const props = defineProps({
  service: { type: Object, required: true },
  task: { type: Object, required: true },
  onSet: { type: Boolean, default: false },
  sourceRid: { type: String, default: '' },
  running: { type: Boolean, default: false },
})

const emit = defineEmits(['run', 'dspace-query'])

// The chosen values live on the task object of the picker's catalogue, so
// they survive switching tabs.
const values = props.task.values

// Tasks without their own parameters use the service's common ones.
const params = props.task.params_help || props.service.params_help || {}
const formats =
  (props.task.supported_formats || props.service.supported_formats || []).join(', ') || 'all'
</script>

<template>
  <div class="cruncher-task">
    <v-alert v-if="task.content" type="info" variant="tonal" density="compact" class="mb-4">
      {{ task.content }}
    </v-alert>

    <ParamField
      v-for="(help, key) in params"
      :key="key"
      v-model="values[key]"
      :name="key"
      :help="help"
      :source-rid="sourceRid"
      @dspace-query="emit('dspace-query', $event)"
    />

    <div class="cruncher-task__footer">
      <p class="cruncher-task__meta">
        Supported formats: {{ formats }}
        <template v-if="task.output_type"> · Output: {{ task.output_type }}</template>
      </p>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-play"
        :loading="running"
        @click="emit('run')"
      >
        {{ onSet ? 'Crunch files in set' : 'Crunch file' }}
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.cruncher-task__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-3);
}

.cruncher-task__meta {
  margin: 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
