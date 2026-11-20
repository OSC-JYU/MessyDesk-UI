<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import ApiKeyField from './ApiKeyField.vue'
import CruncherTask from './CruncherTask.vue'
import { llmProviders, otherProvidersOf, providerTask } from './crunchers.js'

// One LLM entry ("AI prompts" or a task such as "Tag with AI"): the user picks the prompt, then
// the provider (where the files go, what it costs, whether a key is needed), then one of that
// provider's models. Emits `run` with (service, task, modelId, apiKey). `apiKey` is the user's own
// key, asked for when the provider is set to `api_key_source: "user"`; it stays in this
// component's memory and is cleared when the provider changes or the panel closes.
const props = defineProps({
  entry: { type: Object, required: true },
  services: { type: Array, required: true },
  onSet: { type: Boolean, default: false },
  sourceRid: { type: String, default: '' },
  runningKey: { type: String, default: '' },
  initialTaskKey: { type: String, default: '' },
})

const emit = defineEmits(['run', 'help'])

// Up to this many models are shown as a list of radio buttons, more as a searchable select.
const RADIO_LIMIT = 6

const isPrompts = computed(() => props.entry.kind === 'prompts')
const taskKey = ref(props.initialTaskKey || (isPrompts.value ? null : props.entry.tasks[0]?.key))
const task = computed(() => props.entry.tasks.find((t) => t.key === taskKey.value) || null)

const providers = computed(() => (task.value ? llmProviders(props.services, task.value) : []))
const providerId = ref(null)
const provider = computed(
  () => providers.value.find((p) => p.service.id === providerId.value) || null,
)
const service = computed(() => provider.value?.service || null)

const modelId = ref(null)
const model = computed(() => provider.value?.models.find((m) => m.id === modelId.value) || null)
const alsoOn = computed(() =>
  model.value ? otherProvidersOf(providers.value, provider.value, model.value) : [],
)

const chosenTask = computed(() =>
  service.value && model.value ? providerTask(service.value, task.value) : null,
)
const external = computed(() => service.value?.location === 'external')
const needsKey = computed(() => service.value?.api_key_source === 'user')
const apiKey = ref('')
const keyMissing = ref(false)

function run() {
  const key = apiKey.value.trim()
  keyMissing.value = needsKey.value && !key
  if (keyMissing.value) return
  emit('run', service.value, chosenTask.value, model.value.id, needsKey.value ? key : undefined)
}

watch(providerId, () => {
  apiKey.value = ''
  keyMissing.value = false
})
onBeforeUnmount(() => {
  apiKey.value = ''
})

// Preselect what has only one choice; drop choices that no longer exist.
watch(
  providers,
  (list) => {
    if (!list.some((p) => p.service.id === providerId.value))
      providerId.value = list.length === 1 ? list[0].service.id : null
  },
  { immediate: true },
)
watch(
  provider,
  (current) => {
    const models = current?.models || []
    if (!models.some((m) => m.id === modelId.value))
      modelId.value = models.length === 1 ? models[0].id : null
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
      <h4 class="llm-cruncher__label">{{ isPrompts ? '2.' : '1.' }} Provider</h4>
      <p v-if="!providers.length" class="llm-cruncher__muted">
        No provider has a model that can run this on this file.
      </p>
      <v-radio-group v-else v-model="providerId" hide-details>
        <v-radio v-for="p in providers" :key="p.service.id" :value="p.service.id">
          <template #label>
            <span class="llm-cruncher__provider">
              <strong>{{ p.service.name }}</strong>
              <v-chip
                size="x-small"
                label
                variant="tonal"
                :color="p.service.location === 'external' ? 'error' : 'success'"
              >
                {{ p.service.location === 'external' ? 'external' : 'on-premise' }}
              </v-chip>
              <v-chip
                size="x-small"
                label
                variant="tonal"
                :color="p.service.access === 'proprietary' ? 'error' : 'success'"
              >
                {{ p.service.access === 'proprietary' ? 'proprietary' : 'open source' }}
              </v-chip>
              <v-chip
                v-if="p.service.api_key_source === 'user'"
                size="x-small"
                label
                variant="tonal"
              >
                your API key
              </v-chip>
              <span class="llm-cruncher__muted">
                {{ p.models.length }} {{ p.models.length === 1 ? 'model' : 'models' }}
              </span>
              <v-btn
                size="x-small"
                variant="text"
                icon="mdi-help-circle-outline"
                :aria-label="`Help for ${p.service.name}`"
                @click.stop="emit('help', p.service.id)"
              />
            </span>
          </template>
        </v-radio>
      </v-radio-group>

      <template v-if="service">
        <v-alert v-if="external" type="error" variant="tonal" density="compact" class="my-3">
          {{ service.name }} is an external provider.
          <strong>Your {{ onSet ? 'files' : 'file' }} will be sent to {{ service.name }}.</strong>
        </v-alert>
        <ApiKeyField
          v-if="needsKey"
          v-model="apiKey"
          :provider-name="service.name"
          :error="keyMissing ? 'Enter your API key to run this' : ''"
          class="mt-3"
        />
      </template>
    </section>

    <section v-if="provider" class="llm-cruncher__step">
      <h4 class="llm-cruncher__label">{{ isPrompts ? '3.' : '2.' }} Model</h4>
      <v-radio-group v-if="provider.models.length <= RADIO_LIMIT" v-model="modelId" hide-details>
        <v-radio v-for="m in provider.models" :key="m.id" :value="m.id">
          <template #label>
            <span>
              <strong>{{ m.name }}</strong>
              <span class="llm-cruncher__muted">
                {{ m.description }} Input: {{ inputOf(m.supported_types) }}.
              </span>
            </span>
          </template>
        </v-radio>
      </v-radio-group>
      <v-autocomplete
        v-else
        v-model="modelId"
        :items="provider.models"
        item-title="name"
        item-value="id"
        label="Search the models"
        variant="outlined"
        density="compact"
        hide-details
        data-test="model-select"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item
            v-bind="itemProps"
            :subtitle="`${item.raw.description} Input: ${inputOf(item.raw.supported_types)}.`"
          />
        </template>
      </v-autocomplete>
      <p v-if="model && provider.models.length > RADIO_LIMIT" class="llm-cruncher__muted mt-2">
        {{ model.description }} Input: {{ inputOf(model.supported_types) }}.
      </p>
      <p v-if="alsoOn.length" class="llm-cruncher__muted mt-2">
        Also available from {{ alsoOn.join(', ') }}.
      </p>
    </section>

    <section v-if="chosenTask" class="llm-cruncher__step">
      <CruncherTask
        :key="`${service.id}:${model.id}:${chosenTask.key}`"
        :service="service"
        :task="chosenTask"
        :model="model.model"
        :on-set="onSet"
        :source-rid="sourceRid"
        :running="runningKey === `${service.id}:${chosenTask.key}`"
        @run="run"
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
