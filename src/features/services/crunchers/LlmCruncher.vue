<script setup>
import { computed, ref, watch } from 'vue'
import CruncherTask from './CruncherTask.vue'
import { llmModels, providerTask } from './crunchers.js'

// One LLM entry ("AI prompts" or a task such as "Tag with AI"): the user picks the prompt, then
// the model, then the provider. Emits `run` with (service, task, modelId).
const props = defineProps({
  entry: { type: Object, required: true },
  services: { type: Array, required: true },
  onSet: { type: Boolean, default: false },
  sourceRid: { type: String, default: '' },
  runningKey: { type: String, default: '' },
  initialTaskKey: { type: String, default: '' },
})

const emit = defineEmits(['run', 'help'])

const isPrompts = computed(() => props.entry.kind === 'prompts')
const taskKey = ref(props.initialTaskKey || (isPrompts.value ? null : props.entry.tasks[0]?.key))
const task = computed(() => props.entry.tasks.find((t) => t.key === taskKey.value) || null)

const models = computed(() => (task.value ? llmModels(props.services, task.value) : []))
const family = ref(null)
const model = computed(() => models.value.find((m) => m.family === family.value) || null)

const offerKey = ref(null)
const offer = computed(
  () => model.value?.offers.find((o) => `${o.service.id}:${o.modelId}` === offerKey.value) || null,
)
const chosenTask = computed(() =>
  offer.value ? providerTask(offer.value.service, task.value) : null,
)
const external = computed(() => offer.value?.service.location === 'external')

// Preselect what has only one choice; drop choices that no longer exist.
watch(
  models,
  (list) => {
    if (!list.some((m) => m.family === family.value))
      family.value = list.length === 1 ? list[0].family : null
  },
  { immediate: true },
)
watch(
  model,
  (current) => {
    const offers = current?.offers || []
    if (!offers.some((o) => `${o.service.id}:${o.modelId}` === offerKey.value)) {
      offerKey.value = offers.length === 1 ? `${offers[0].service.id}:${offers[0].modelId}` : null
    }
  },
  { immediate: true },
)

function inputOf(types) {
  return types?.length ? types.join(', ') : 'all'
}
</script>

<template>
  <div class="llm-cruncher">
    <section v-if="isPrompts" class="llm-cruncher__step">
      <h4 class="llm-cruncher__label">1. Prompt</h4>
      <v-select
        v-model="taskKey"
        :items="entry.tasks"
        item-title="name"
        item-value="key"
        label="Choose a prompt"
        variant="outlined"
        density="compact"
        hide-details
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item v-bind="itemProps" :subtitle="item.raw.description || item.raw.content">
            <template #append>
              <v-chip
                size="x-small"
                label
                variant="tonal"
                :color="item.raw.output_type === 'json' ? 'warning' : 'success'"
              >
                {{ item.raw.output_type === 'json' ? 'JSON' : 'text' }}
              </v-chip>
            </template>
          </v-list-item>
        </template>
      </v-select>
      <p v-if="!entry.tasks.length" class="llm-cruncher__muted">
        You have no prompts for this kind of file. Add one under Prompts.
      </p>
    </section>

    <section v-if="task" class="llm-cruncher__step">
      <h4 class="llm-cruncher__label">{{ isPrompts ? '2.' : '1.' }} Model</h4>
      <p v-if="!models.length" class="llm-cruncher__muted">No model can run this on this file.</p>
      <v-radio-group v-else v-model="family" hide-details>
        <v-radio v-for="m in models" :key="m.family" :value="m.family">
          <template #label>
            <span>
              <strong>{{ m.name }}</strong>
              <span class="llm-cruncher__muted">
                {{ m.description }} Input: {{ inputOf(m.supported_types) }}.
                {{ m.offers.length > 1 ? `${m.offers.length} providers.` : '' }}
              </span>
            </span>
          </template>
        </v-radio>
      </v-radio-group>
    </section>

    <section v-if="model" class="llm-cruncher__step">
      <h4 class="llm-cruncher__label">{{ isPrompts ? '3.' : '2.' }} Provider</h4>
      <v-radio-group v-model="offerKey" hide-details>
        <v-radio
          v-for="o in model.offers"
          :key="`${o.service.id}:${o.modelId}`"
          :value="`${o.service.id}:${o.modelId}`"
        >
          <template #label>
            <span class="llm-cruncher__provider">
              <strong>{{ o.service.name }}</strong>
              <v-chip
                size="x-small"
                label
                variant="tonal"
                :color="o.service.location === 'external' ? 'error' : 'success'"
              >
                {{ o.service.location === 'external' ? 'external' : 'on-premise' }}
              </v-chip>
              <v-chip
                size="x-small"
                label
                variant="tonal"
                :color="o.service.access === 'proprietary' ? 'error' : 'success'"
              >
                {{ o.service.access === 'proprietary' ? 'proprietary' : 'open source' }}
              </v-chip>
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-help-circle-outline"
                :aria-label="`Help for ${o.service.name}`"
                @click.stop="emit('help', o.service.id)"
              />
            </span>
          </template>
        </v-radio>
      </v-radio-group>
    </section>

    <section v-if="chosenTask" class="llm-cruncher__step">
      <v-alert v-if="external" type="error" variant="tonal" density="compact" class="mb-4">
        {{ offer.service.name }} is an external provider.
        <strong
          >Your {{ onSet ? 'files' : 'file' }} will be sent to {{ offer.service.name }}.</strong
        >
      </v-alert>
      <CruncherTask
        :key="`${offer.service.id}:${chosenTask.key}`"
        :service="offer.service"
        :task="chosenTask"
        :on-set="onSet"
        :source-rid="sourceRid"
        :running="runningKey === `${offer.service.id}:${chosenTask.key}`"
        @run="emit('run', offer.service, chosenTask, offer.modelId)"
      />
    </section>
  </div>
</template>

<style scoped>
.llm-cruncher__step {
  margin-block-end: var(--md-space-4);
}

.llm-cruncher__label {
  margin: 0 0 var(--md-space-2);
  font-family: var(--md-font-body) !important;
  font-size: var(--md-font-size-sm);
}

.llm-cruncher__muted {
  display: block;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.llm-cruncher__provider {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-space-2);
}
</style>
