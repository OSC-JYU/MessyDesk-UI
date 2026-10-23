<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { deskHint, groupByRun, roiKey, runLabel } from './tagGroups.js'
import { createTagLoaders } from './tagLoaders.js'
import RoiLabelPicker from './RoiLabelPicker.vue'

// A compact tag chooser for one desk: human tags by type, machine tags by run and, in a
// separate section, ROI labels found in text. Groups are collapsed and load their tags in
// pages, so a desk with hundreds of tags stays usable.
//   v-model:tags  chosen tags, [{ '@rid', label }]
//   v-model:roi   chosen ROI labels, [{ service_id, task, model, label }]
const tags = defineModel('tags', { type: Array, default: () => [] })
const roi = defineModel('roi', { type: Array, default: () => [] })

const props = defineProps({
  // The desk the lists are limited to; empty means all the user's desks.
  deskRid: { type: String, default: '' },
})

const MACHINE_PAGE = 50

const state = reactive({
  search: '',
  types: [],
  typeItems: {},
  machineTags: [],
  error: null,
})
const typed = ref('')
const openType = ref(null)
const shown = reactive({})

const deskRids = computed(() => (props.deskRid ? [props.deskRid] : []))
const { loadTypes, loadType, loadMachine } = createTagLoaders(state, deskRids)

const normalized = (rid) => `#${String(rid).replace('#', '')}`
const isSelected = (rid) => tags.value.some((tag) => normalized(tag['@rid']) === normalized(rid))

function toggle(rid, label) {
  tags.value = isSelected(rid)
    ? tags.value.filter((tag) => normalized(tag['@rid']) !== normalized(rid))
    : [...tags.value, { '@rid': normalized(rid), label }]
}

const machineGroups = computed(() => {
  const needle = state.search.trim().toLowerCase()
  const matching = needle
    ? state.machineTags.filter((tag) => String(tag.label).toLowerCase().includes(needle))
    : state.machineTags
  return groupByRun(matching)
})
const machineShown = (group) => group.tags.slice(0, shown[group.key] || MACHINE_PAGE)

const reload = () => Promise.all([loadTypes(), loadMachine()])

let timer = null
watch(typed, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    state.search = String(value || '').trim()
    loadTypes()
  }, 300)
})
watch(
  () => [openType.value, state.typeItems[openType.value]],
  () => openType.value && loadType(openType.value),
)
watch(() => props.deskRid, reload)
onMounted(reload)
onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="tag-picker">
    <v-text-field
      v-model="typed"
      label="Search tags"
      variant="outlined"
      density="compact"
      prepend-inner-icon="mdi-magnify"
      clearable
      hide-details
      class="mb-3"
    />

    <div
      v-if="tags.length || roi.length"
      class="tag-picker__chips mb-3"
      aria-label="Selected tags"
      data-test="selected"
    >
      <v-chip
        v-for="tag in tags"
        :key="tag['@rid']"
        color="primary"
        size="small"
        closable
        @click:close="toggle(tag['@rid'], tag.label)"
      >
        {{ tag.label }}
      </v-chip>
      <v-chip
        v-for="item in roi"
        :key="roiKey(item)"
        color="secondary"
        size="small"
        prepend-icon="mdi-text-search"
        closable
        @click:close="roi = roi.filter((r) => roiKey(r) !== roiKey(item))"
      >
        {{ item.label }}
      </v-chip>
    </div>

    <ErrorAlert :error="state.error" title="Could not load tags" class="mb-3" />

    <h4 class="tag-picker__heading">Tags</h4>
    <p v-if="!state.types.length" class="tag-picker__muted">
      {{ state.search ? 'No tags match.' : 'No tags yet.' }}
    </p>
    <v-expansion-panels v-else v-model="openType" variant="accordion">
      <v-expansion-panel
        v-for="type in state.types"
        :key="type.type"
        :value="type.type"
        :title="`${type.type} (${type.count})`"
      >
        <v-expansion-panel-text>
          <div class="tag-picker__chips">
            <v-chip
              v-for="item in state.typeItems[type.type]?.items || []"
              :key="item['@rid']"
              :color="isSelected(item['@rid']) ? 'primary' : undefined"
              :variant="isSelected(item['@rid']) ? 'flat' : 'tonal'"
              size="small"
              @click="toggle(item['@rid'], item.label)"
            >
              {{ item.label }}
              <span v-if="!deskRid && deskHint(item)" class="tag-picker__hint">
                · {{ deskHint(item) }}
              </span>
            </v-chip>
          </div>
          <v-progress-linear
            v-if="state.typeItems[type.type]?.loading"
            indeterminate
            class="mt-2"
          />
          <v-btn
            v-else-if="
              (state.typeItems[type.type]?.items.length || 0) <
              (state.typeItems[type.type]?.total || 0)
            "
            size="small"
            variant="text"
            class="mt-2"
            data-test="type-more"
            @click="loadType(type.type, true)"
          >
            Show more ({{
              state.typeItems[type.type].total - state.typeItems[type.type].items.length
            }}
            left)
          </v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <template v-if="machineGroups.length">
      <h4 class="tag-picker__heading">Machine tags</h4>
      <v-expansion-panels variant="accordion">
        <v-expansion-panel
          v-for="group in machineGroups"
          :key="group.key"
          :title="`${runLabel(group)} (${group.tags.length})`"
        >
          <v-expansion-panel-text>
            <div class="tag-picker__chips">
              <v-chip
                v-for="tag in machineShown(group)"
                :key="tag.entity_rid"
                :color="isSelected(tag.entity_rid) ? 'primary' : 'secondary'"
                :variant="isSelected(tag.entity_rid) ? 'flat' : 'tonal'"
                size="small"
                @click="toggle(tag.entity_rid, tag.label)"
              >
                {{ tag.label }} <span class="tag-picker__hint">({{ tag.count }})</span>
              </v-chip>
            </div>
            <v-btn
              v-if="group.tags.length > machineShown(group).length"
              size="small"
              variant="text"
              class="mt-2"
              data-test="machine-more"
              @click="shown[group.key] = machineShown(group).length + MACHINE_PAGE"
            >
              Show more ({{ group.tags.length - machineShown(group).length }} left)
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </template>

    <h4 class="tag-picker__heading">Text</h4>
    <RoiLabelPicker v-model="roi" :desk-rids="deskRids" :search="state.search" />
  </div>
</template>

<style scoped>
.tag-picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
}

.tag-picker__heading {
  margin: var(--md-space-4) 0 var(--md-space-2);
  font-family: var(--md-font-body) !important;
  font-size: var(--md-font-size-sm);
  font-weight: var(--md-font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--md-color-text-muted);
}

.tag-picker__muted {
  margin: 0;
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-xs);
}

.tag-picker__hint {
  margin-inline-start: var(--md-space-1);
  font-size: var(--md-font-size-xs);
  opacity: 0.8;
}
</style>
