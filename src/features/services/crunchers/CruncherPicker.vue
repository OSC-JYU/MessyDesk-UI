<script setup>
import { computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  createFileProcess,
  createFilter,
  createROIProcess,
  createSetProcess,
  createSourceProcess,
  getServicesForFile,
} from '@/api/services.js'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import CruncherService from './CruncherService.vue'
import CruncherTask from './CruncherTask.vue'
import LlmCruncher from './LlmCruncher.vue'
import TagFilterDialog from './TagFilterDialog.vue'
import {
  buildProcess,
  categoryOf,
  categoryTabs,
  categoryTitle,
  inCategory,
  isLlmService,
  prepareCatalogue,
  processTarget,
  searchCatalogue,
} from './crunchers.js'

// Lists the crunchers (services and filters) that can process a node and
// runs the chosen one. Emits `done` ({ reload }) once something was started.
const props = defineProps({
  node: { type: Object, default: null }, // { id, type }
  cruncherFilter: { type: String, default: '' },
})

const emit = defineEmits(['done'])
const router = useRouter()

const state = reactive({
  catalogue: { services: [], filters: [], llm: [] },
  loading: false,
  error: null,
  tab: 'preparation',
  search: '',
  runningKey: '',
  tagFilter: { open: false, id: '' },
})

const target = computed(() => processTarget(props.node?.type, props.cruncherFilter))
const onSet = computed(() => target.value === 'set')
const tabs = computed(() => categoryTabs(state.catalogue))
const results = computed(() => searchCatalogue(state.catalogue, state.search || ''))
// LLM services are shown through their combined entries (LlmCruncher), not one by one.
const plainServices = computed(() => state.catalogue.services.filter((s) => !isLlmService(s)))

async function load() {
  state.catalogue = { services: [], filters: [], llm: [] }
  state.error = null
  if (!props.node?.id) return
  state.loading = true
  try {
    state.catalogue = prepareCatalogue(
      await getServicesForFile(props.node.id, props.cruncherFilter),
    )
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
}

const RUNNERS = {
  source: createSourceProcess,
  set: createSetProcess,
  roi: createROIProcess,
  file: createFileProcess,
}

async function run(service, task, model) {
  state.runningKey = `${service.id}:${task.key}`
  state.error = null
  try {
    await RUNNERS[target.value](buildProcess(service, task, model), props.node.id)
    emit('done', { reload: false })
  } catch (error) {
    state.error = error
  } finally {
    state.runningKey = ''
  }
}

async function runFilter(filter) {
  if (filter.id === 'mdf-set-filter') {
    state.tagFilter = { open: true, id: filter.id }
    return
  }
  state.runningKey = `filter:${filter.id}`
  state.error = null
  try {
    await createFilter(filter.id, props.node.id)
    emit('done', { reload: true })
  } catch (error) {
    state.error = error
  } finally {
    state.runningKey = ''
  }
}

async function runDspaceQuery(query) {
  const params = { query: query.solrQuery, ...query.params }
  try {
    await createSourceProcess({ service: 'md-dspace7', id: 'make_query', params }, props.node.id)
    emit('done', { reload: false })
  } catch (error) {
    state.error = error
  }
}

function openHelp(serviceId) {
  const href = router.resolve({ name: 'service-help', params: { service: serviceId } }).href
  window.open(href, '_blank', 'noopener,noreferrer')
}

watch(() => [props.node?.id, props.cruncherFilter], load, { immediate: true })
</script>

<template>
  <div class="cruncher-picker">
    <EmptyState
      v-if="!node?.id"
      icon="mdi-cursor-default-click"
      title="No file selected"
      text="Select a file or set on the desk first."
    />
    <template v-else>
      <v-text-field
        v-model="state.search"
        label="Search crunchers"
        placeholder="Name, description or task"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        clearable
        hide-details
        class="mb-4"
      />
      <ErrorAlert :error="state.error" title="Cruncher failed" class="mb-4" />
      <LoadingState v-if="state.loading" text="Finding crunchers for this file…" />

      <template v-else-if="state.search">
        <EmptyState v-if="!results.length" icon="mdi-magnify" title="No matching crunchers" />
        <v-expansion-panels v-else variant="accordion">
          <v-expansion-panel v-for="item in results" :key="item.key">
            <v-expansion-panel-title>
              <span class="cruncher-picker__name">{{ item.name }}</span>
              <v-chip
                v-if="item.kind === 'task'"
                size="x-small"
                label
                color="primary"
                variant="tonal"
                class="ms-2"
              >
                {{ item.service.name }}
              </v-chip>
              <v-chip
                v-if="item.kind === 'llm'"
                size="x-small"
                label
                color="primary"
                variant="tonal"
                class="ms-2"
              >
                {{ item.entry.name }}
              </v-chip>
              <v-chip size="x-small" label variant="outlined" class="ms-2">
                {{ categoryTitle(categoryOf(item.service || item.filter || item.entry)) }}
              </v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <LlmCruncher
                v-if="item.kind === 'llm'"
                :entry="item.entry"
                :services="state.catalogue.services"
                :initial-task-key="item.task.key"
                :on-set="onSet"
                :source-rid="node.id"
                :running-key="state.runningKey"
                @run="run"
                @help="openHelp"
              />
              <CruncherTask
                v-else-if="item.kind === 'task'"
                :service="item.service"
                :task="item.task"
                :on-set="onSet"
                :source-rid="node.id"
                :running="state.runningKey === `${item.service.id}:${item.task.key}`"
                @run="run(item.service, item.task, null)"
                @dspace-query="runDspaceQuery"
              />
              <div v-else class="cruncher-picker__filter">
                <span>{{ item.filter.description }}</span>
                <v-btn
                  color="primary"
                  variant="flat"
                  :loading="state.runningKey === `filter:${item.filter.id}`"
                  @click="runFilter(item.filter)"
                >
                  Create filter
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>

      <template v-else>
        <v-tabs v-model="state.tab" color="primary" grow class="mb-4">
          <v-tab
            v-for="tab in tabs"
            :key="tab.value"
            :value="tab.value"
            :prepend-icon="tab.icon"
            class="cruncher-picker__tab"
          >
            {{ tab.title }}
          </v-tab>
        </v-tabs>
        <v-window v-model="state.tab">
          <v-window-item v-for="tab in tabs" :key="tab.value" :value="tab.value">
            <EmptyState
              v-if="
                !inCategory(plainServices, tab.value).length &&
                !inCategory(state.catalogue.llm, tab.value).length &&
                !inCategory(state.catalogue.filters, tab.value).length
              "
              icon="mdi-cog-off-outline"
              title="No crunchers in this category for this file"
            />
            <v-expansion-panels variant="accordion">
              <v-expansion-panel
                v-for="entry in inCategory(state.catalogue.llm, tab.value)"
                :key="entry.key"
                class="cruncher-picker__llm"
              >
                <v-expansion-panel-title>
                  <div class="cruncher-picker__llm-head">
                    <span class="cruncher-picker__name">
                      <v-icon icon="mdi-creation" size="small" class="me-1" />{{ entry.name }}
                    </span>
                    <span class="cruncher-picker__llm-description">{{ entry.description }}</span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <LlmCruncher
                    :entry="entry"
                    :services="state.catalogue.services"
                    :on-set="onSet"
                    :source-rid="node.id"
                    :running-key="state.runningKey"
                    @run="run"
                    @help="openHelp"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
              <CruncherService
                v-for="service in inCategory(plainServices, tab.value)"
                :key="service.id"
                :service="service"
                :on-set="onSet"
                :source-rid="node.id"
                :running-key="state.runningKey"
                @run="(task, model) => run(service, task, model)"
                @help="openHelp"
                @dspace-query="runDspaceQuery"
              />
            </v-expansion-panels>
            <v-expansion-panels
              v-if="inCategory(state.catalogue.filters, tab.value).length"
              variant="accordion"
              class="mt-4"
            >
              <v-expansion-panel
                v-for="filter in inCategory(state.catalogue.filters, tab.value)"
                :key="filter.id"
                :title="filter.name || filter.id"
              >
                <v-expansion-panel-text>
                  <div class="cruncher-picker__filter">
                    <span>{{ filter.description }}</span>
                    <v-btn
                      color="primary"
                      variant="flat"
                      :loading="state.runningKey === `filter:${filter.id}`"
                      @click="runFilter(filter)"
                    >
                      Create filter
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-window-item>
        </v-window>
      </template>

      <TagFilterDialog
        v-model="state.tagFilter.open"
        :filter-id="state.tagFilter.id || 'mdf-set-filter'"
        :set-rid="node.id"
        @created="emit('done', { reload: true })"
      />
    </template>
  </div>
</template>

<style scoped>
.cruncher-picker {
  padding: var(--md-space-4) var(--md-space-5);
}

.cruncher-picker__name {
  font-weight: var(--md-font-weight-medium);
}

.cruncher-picker__llm-head {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-1);
}

.cruncher-picker__llm-description {
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.cruncher-picker__tab {
  text-transform: none;
  letter-spacing: normal;
}

.cruncher-picker__filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-3);
  color: var(--md-color-text-muted);
}
</style>
