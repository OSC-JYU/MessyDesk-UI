<script setup>
import { reactive, watch } from 'vue'
import { getTagPassages } from '@/api/entities.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import { tagColor } from '@/features/files/roi/tagColors.js'

// The coded passages of the selected tags: the marked text with a little of what is around it, the
// text it is in and the tags of the passage. Opening one opens its text.
const props = defineProps({
  tags: { type: Array, required: true },
  deskRids: { type: Array, default: () => [] },
})
const emit = defineEmits(['open-file'])

const PER_PAGE = 20
const state = reactive({ items: [], total: 0, page: 1, loading: false, error: null })
let token = 0

async function load() {
  const mine = ++token
  if (!props.tags.length) {
    Object.assign(state, { items: [], total: 0 })
    return
  }
  state.loading = true
  state.error = null
  try {
    const response = await getTagPassages(props.tags, {
      projectRids: props.deskRids,
      skip: (state.page - 1) * PER_PAGE,
      limit: PER_PAGE,
    })
    if (mine !== token) return
    state.items = response?.items || []
    state.total = response?.total || 0
  } catch (error) {
    if (mine === token) state.error = error
  } finally {
    if (mine === token) state.loading = false
  }
}

watch(
  () => [props.tags.map((t) => t['@rid']).join(','), props.deskRids.join(',')],
  () => {
    state.page = 1
    load()
  },
  { immediate: true },
)
watch(() => state.page, load)
</script>

<template>
  <section class="passages" aria-label="Coded passages">
    <h2 class="passages__title">Coded passages ({{ state.total }})</h2>
    <ErrorAlert :error="state.error" title="Could not load the passages" class="mb-3" />
    <v-progress-linear v-if="state.loading" indeterminate class="mb-3" />
    <EmptyState
      v-else-if="!state.items.length"
      icon="mdi-format-quote-close"
      title="No coded passages"
      text="Passages are coded in a text ROI set. Files that only have these tags as whole-file tags are under Files."
    />
    <ul class="passages__list">
      <li
        v-for="item in state.items"
        :key="`${item.file_rid}|${item.roi_set}|${item.region_id}`"
        class="passages__item"
      >
        <p class="passages__quote">
          <span class="passages__around">{{ item.before }}</span
          ><mark class="passages__mark">{{ item.text }}</mark
          ><span class="passages__around">{{ item.after }}</span>
        </p>
        <div class="passages__meta">
          <button type="button" class="passages__file" @click="emit('open-file', item)">
            {{ item.file_label }}
          </button>
          <span v-for="tag in item.tags" :key="tag.rid" class="passages__tag">
            <span class="passages__dot" :style="{ backgroundColor: tagColor(tag) }" />
            {{ tag.label }}
          </span>
        </div>
      </li>
    </ul>
    <v-pagination
      v-if="state.total > PER_PAGE"
      v-model="state.page"
      :length="Math.ceil(state.total / PER_PAGE)"
      density="comfortable"
      class="mt-3"
    />
  </section>
</template>

<style scoped>
.passages__title {
  margin: 0 0 var(--md-space-3);
  font-size: var(--md-font-size-md);
}

.passages__list {
  display: grid;
  gap: var(--md-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.passages__item {
  padding: var(--md-space-3);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-md);
}

.passages__quote {
  margin: 0 0 var(--md-space-2);
  white-space: pre-wrap;
  word-break: break-word;
}

.passages__around {
  color: var(--md-color-text-muted);
}

.passages__mark {
  background: var(--md-color-primary-soft);
  color: inherit;
}

.passages__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-space-2);
  font-size: var(--md-font-size-sm);
}

.passages__file {
  padding: 0;
  border: 0;
  background: none;
  color: var(--md-color-primary);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.passages__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.passages__dot {
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
}
</style>
