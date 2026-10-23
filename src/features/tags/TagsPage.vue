<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import ResultsGrid from '@/features/search/ResultsGrid.vue'
import ProjectScope from '@/features/search/ProjectScope.vue'
import { deskForResults, useFileOpener } from '@/features/search/useFileOpener.js'
import { TAGGED_FILES_PER_PAGE, useTags } from './useTags.js'
import { deskHint, nerLabelKey, runLabel } from './tagGroups.js'
import NerLabel from './NerLabel.vue'
import MentionPreview from './MentionPreview.vue'
import TagAdminDialog from './TagAdminDialog.vue'

// Browse files by tag: manual tags, tags added by machines, and the named
// entities (NER) models found in the text.
const route = useRoute()
const openResult = useFileOpener()

const scope = computed(() => String(route.params.rid || 'global').replace('#', ''))
const fixedDesk = computed(() => (route.params.rid ? `#${scope.value}` : ''))
const tags = useTags(scope, fixedDesk)
const { state } = tags

const view = reactive({ preview: null, adminOpen: false, openType: null })
// A type's tags are loaded when its panel opens, and again when the list is reloaded
// (search or desk change) while it is open.
watch(
  () => [view.openType, state.typeItems[view.openType]],
  () => view.openType && tags.loadType(view.openType),
)
const searching = computed(() => Boolean(String(state.search || '').trim()))
const title = computed(() => {
  if (!state.selected.length) return 'Tagged files'
  const mode = state.selected.length > 1 && state.match === 'and' ? ' (all)' : ''
  return `Tags${mode}: ${state.selected.map((t) => t.label).join(', ')}`
})
const projectRid = computed(() => deskForResults(route.params.rid, state.desks))

function openFile(result, index) {
  openResult({
    result,
    index,
    results: tags.results.value,
    query: title.value,
    projectRid: projectRid.value,
    kind: 'tags',
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
      :total="state.selected.length ? state.total : 0"
      :per-page="TAGGED_FILES_PER_PAGE"
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
      <v-btn-toggle
        v-if="state.selected.length > 1"
        v-model="state.match"
        mandatory
        density="comfortable"
        variant="outlined"
        divided
        class="mb-4"
        aria-label="Files must have"
        data-test="tag-match"
      >
        <v-btn value="or" size="small">Any selected tag</v-btn>
        <v-btn value="and" size="small">All selected tags</v-btn>
      </v-btn-toggle>

      <ErrorAlert :error="state.error" title="Could not load tags" class="mb-4" />

      <section class="tags-page__section">
        <div class="tags-page__section-head">
          <h3 class="tags-page__heading">Tags</h3>
          <div>
            <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-tag-cog-outline"
              data-test="tag-admin"
              @click="view.adminOpen = true"
              >Tag admin</v-btn
            >
          </div>
        </div>
        <EmptyState
          v-if="!tags.manualTypes.value.length"
          icon="mdi-tag-outline"
          :title="searching ? 'No tags match' : 'No tags yet'"
        />
        <v-expansion-panels v-else v-model="view.openType" variant="accordion">
          <v-expansion-panel
            v-for="type in tags.manualTypes.value"
            :key="type.type"
            :value="type.type"
            :title="`${type.type} (${type.count})`"
          >
            <v-expansion-panel-text>
              <div class="tags-page__chips">
                <v-chip
                  v-for="item in state.typeItems[type.type]?.items || []"
                  :key="item['@rid']"
                  :color="tags.isSelected(item['@rid']) ? 'primary' : undefined"
                  :variant="tags.isSelected(item['@rid']) ? 'flat' : 'tonal'"
                  size="small"
                  @click="tags.toggle(item)"
                >
                  {{ item.label }}
                  <span v-if="!fixedDesk && deskHint(item)" class="tags-page__count">
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
                @click="tags.loadType(type.type, true)"
              >
                Show more ({{
                  state.typeItems[type.type].total - state.typeItems[type.type].items.length
                }}
                left)
              </v-btn>
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
                  :tag-rids="tags.selectedTagRids.value"
                  :tag-match="state.match"
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

    <TagAdminDialog v-model="view.adminOpen" :desk-rid="fixedDesk" @changed="tags.loadTypes" />
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
