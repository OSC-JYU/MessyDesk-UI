<script setup>
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import ResultsGrid from '@/features/search/ResultsGrid.vue'
import ProjectScope from '@/features/search/ProjectScope.vue'
import { deskForResults, useFileOpener } from '@/features/search/useFileOpener.js'
import { useTags } from './useTags.js'
import { nerLabelKey, runLabel } from './tagGroups.js'
import NerLabel from './NerLabel.vue'
import MentionPreview from './MentionPreview.vue'
import AddTagDialog from './AddTagDialog.vue'

// Browse files by tag: manual tags, tags added by machines, and the named
// entities (NER) models found in the text.
const route = useRoute()
const openResult = useFileOpener()

const scope = computed(() => String(route.params.rid || 'global').replace('#', ''))
const fixedDesk = computed(() => (route.params.rid ? `#${scope.value}` : ''))
const tags = useTags(scope, fixedDesk)
const { state } = tags

const view = reactive({ preview: null, addOpen: false })
const searching = computed(() => Boolean(String(state.search || '').trim()))
const title = computed(() =>
  state.selected.length ? `Tags: ${state.selected.map((t) => t.label).join(', ')}` : 'Tagged files',
)
const projectRid = computed(() => deskForResults(route.params.rid, state.desks))

function openFile(result, index) {
  openResult({
    result,
    index,
    results: tags.results.value,
    query: title.value,
    projectRid: projectRid.value,
  })
}

function openHitFile(hit) {
  openFile({ rid: `#${String(hit.file_rid).replace('#', '')}`, label: hit.file_label }, 0)
}
</script>

<template>
  <div class="tags-page">
    <MentionPreview
      v-if="view.preview"
      class="tags-page__main"
      :hit="view.preview.hit"
      :mention="view.preview.mention"
      @close="view.preview = null"
      @open-file="openHitFile"
    />
    <ResultsGrid
      v-else
      v-model:page="state.page"
      class="tags-page__main"
      :title="title"
      :results="tags.results.value"
      :loading="state.loading"
      :empty-title="
        state.selected.length ? 'No files with these tags' : 'Pick a tag to see its files'
      "
      :empty-text="
        state.selected.length
          ? ''
          : 'Choose tags on the right, or browse what models found in the text.'
      "
      @open="openFile"
    />

    <aside class="tags-page__side">
      <v-text-field
        v-model="state.search"
        label="Search tags"
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-magnify"
        clearable
        hide-details
        class="mb-4"
      />
      <ProjectScope v-if="!fixedDesk" v-model="state.desks" label="Tag context" class="mb-4" />

      <div v-if="state.selected.length" class="tags-page__chips mb-4" aria-label="Selected tags">
        <v-chip
          v-for="tag in state.selected"
          :key="tag['@rid']"
          :color="tag.color || 'primary'"
          closable
          @click:close="tags.toggle(tag)"
        >
          {{ tag.label }}
        </v-chip>
      </div>

      <ErrorAlert :error="state.error" title="Could not load tags" class="mb-4" />

      <section class="tags-page__section">
        <div class="tags-page__section-head">
          <h3 class="tags-page__heading">Tags</h3>
          <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="view.addOpen = true"
            >New tag</v-btn
          >
        </div>
        <EmptyState
          v-if="!tags.manualTypes.value.length"
          icon="mdi-tag-outline"
          :title="searching ? 'No tags match' : 'No tags yet'"
        />
        <v-expansion-panels v-else variant="accordion">
          <v-expansion-panel
            v-for="type in tags.manualTypes.value"
            :key="type.type"
            :title="`${type.type} (${type.items.length})`"
          >
            <v-expansion-panel-text>
              <div class="tags-page__chips">
                <v-chip
                  v-for="item in type.items"
                  :key="item['@rid']"
                  :color="tags.isSelected(item['@rid']) ? 'primary' : undefined"
                  :variant="tags.isSelected(item['@rid']) ? 'flat' : 'tonal'"
                  size="small"
                  @click="tags.toggle(item)"
                >
                  {{ item.label }}
                </v-chip>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </section>

      <section v-if="tags.machineGroups.value.length" class="tags-page__section">
        <h3 class="tags-page__heading">Machine tags</h3>
        <v-expansion-panels variant="accordion">
          <v-expansion-panel
            v-for="group in tags.machineGroups.value"
            :key="group.key"
            :title="runLabel(group)"
          >
            <v-expansion-panel-text>
              <div class="tags-page__chips">
                <v-chip
                  v-for="tag in group.tags"
                  :key="tag.entity_rid"
                  :color="tags.isSelected(tag.entity_rid) ? 'primary' : 'secondary'"
                  :variant="tags.isSelected(tag.entity_rid) ? 'flat' : 'tonal'"
                  size="small"
                  @click="tags.toggle({ '@rid': tag.entity_rid, label: tag.label })"
                >
                  {{ tag.label }} <span class="tags-page__count">({{ tag.count }})</span>
                </v-chip>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </section>

      <section v-if="tags.nerGroups.value.length" class="tags-page__section">
        <h3 class="tags-page__heading">Found in text (NER)</h3>
        <v-expansion-panels variant="accordion">
          <v-expansion-panel v-for="group in tags.nerGroups.value" :key="group.key">
            <v-expansion-panel-title>
              {{ runLabel(group) }}
              <span v-if="searching" class="tags-page__count">
                ({{ group.tags.reduce((sum, t) => sum + (t.count || 0), 0) }})
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-expansion-panels variant="accordion">
                <NerLabel
                  v-for="tag in group.tags"
                  :key="nerLabelKey(tag)"
                  :tag="tag"
                  :search="state.search || ''"
                  :desk-rids="tags.deskRids.value"
                  :file-rids="tags.selectedFileRids.value"
                  :show-count="searching"
                  @preview="view.preview = $event"
                  @close-preview="view.preview = null"
                />
              </v-expansion-panels>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </section>

      <v-alert
        v-if="state.filterIgnored && tags.deskRids.value.length"
        type="info"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        Limiting tags to desks is not available in the backend yet. Showing tags from all desks.
      </v-alert>
    </aside>

    <AddTagDialog v-model="view.addOpen" @created="tags.loadTypes" />
  </div>
</template>

<style scoped>
.tags-page {
  display: grid;
  grid-template-columns: minmax(0, 1fr) calc(var(--md-card-min-width) * 1.3);
  height: 100%;
}

.tags-page__main {
  min-width: 0;
}

.tags-page__side {
  padding: var(--md-space-5) var(--md-space-4);
  border-inline-start: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
  overflow-y: auto;
}

.tags-page__section {
  margin-block-end: var(--md-space-5);
}

.tags-page__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tags-page__heading {
  margin: 0 0 var(--md-space-2);
  font-family: var(--md-font-body) !important;
  font-size: var(--md-font-size-sm);
  font-weight: var(--md-font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--md-color-text-muted);
}

.tags-page__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
}

.tags-page__count {
  margin-inline-start: var(--md-space-1);
  font-size: var(--md-font-size-xs);
  opacity: 0.8;
}
</style>
