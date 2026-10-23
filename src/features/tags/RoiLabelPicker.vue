<script setup>
import { computed, reactive, ref, watch } from 'vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { groupByRun, roiCriterion, roiKey, runLabel } from './tagGroups.js'
import { createRoiLoader } from './tagLoaders.js'

// The "Found in text (ROI labels)" section of the TagPicker: labels that models found in the text
// (indexed ner.json runs), by run, with the number of files. Loaded when the section is opened.
const selected = defineModel({ type: Array, default: () => [] })

const props = defineProps({
  deskRids: { type: Array, default: () => [] },
  search: { type: String, default: '' },
})

const open = ref(null)
const roi = reactive({ items: [], hasMore: false, loading: false, error: null, loaded: false })
const load = createRoiLoader(
  roi,
  computed(() => props.deskRids),
  () => props.search,
)

const groups = computed(() => groupByRun(roi.items))
const isSelected = (item) => selected.value.some((s) => roiKey(s) === roiKey(item))

function toggle(item) {
  selected.value = isSelected(item)
    ? selected.value.filter((s) => roiKey(s) !== roiKey(item))
    : [...selected.value, roiCriterion(item)]
}

watch(open, (value) => {
  if (value === 'roi' && !roi.loaded && !roi.loading) load()
})
watch(
  () => [props.search, props.deskRids],
  () => open.value === 'roi' && load(),
  { deep: true },
)
</script>

<template>
  <v-expansion-panels v-model="open" variant="accordion">
    <v-expansion-panel value="roi" title="Found in text (ROI labels)">
      <v-expansion-panel-text>
        <ErrorAlert
          :error="roi.error"
          title="Could not load ROI labels"
          retryable
          class="mb-2"
          @retry="load()"
        />
        <p v-if="roi.loaded && !roi.error && !roi.items.length" class="roi-picker__muted">
          {{ search ? 'No labels match.' : 'No labels found in the text of this desk yet.' }}
        </p>
        <v-expansion-panels v-if="groups.length" variant="accordion">
          <v-expansion-panel v-for="group in groups" :key="group.key" :title="runLabel(group)">
            <v-expansion-panel-text>
              <div class="roi-picker__chips">
                <v-chip
                  v-for="item in group.tags"
                  :key="roiKey(item)"
                  :color="isSelected(item) ? 'primary' : undefined"
                  :variant="isSelected(item) ? 'flat' : 'tonal'"
                  size="small"
                  @click="toggle(item)"
                >
                  {{ item.label }} <span class="roi-picker__count">({{ item.count }})</span>
                </v-chip>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-progress-linear v-if="roi.loading" indeterminate class="mt-2" />
        <v-btn
          v-else-if="roi.hasMore"
          size="small"
          variant="text"
          class="mt-2"
          data-test="roi-more"
          @click="load(true)"
        >
          Load more
        </v-btn>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<style scoped>
.roi-picker__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
}

.roi-picker__count {
  margin-inline-start: var(--md-space-1);
  font-size: var(--md-font-size-xs);
  opacity: 0.8;
}

.roi-picker__muted {
  margin: 0;
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-xs);
}
</style>
