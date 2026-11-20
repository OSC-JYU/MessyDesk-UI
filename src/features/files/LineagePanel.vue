<script setup>
import { computed, ref, watch } from 'vue'
import { getNodePath } from '@/api/projects.js'
import { previewUrl } from './fileUrls.js'
import ThumbnailImage from '@/ui/ThumbnailImage.vue'
import {
  isOpenable,
  isRemoved,
  levelLabel,
  nodeColour,
  nodeIcon,
  nodeKind,
  offsetInLineage,
  visibleLineage,
} from './lineage.js'

// The chain of nodes the file came from, from the desk down. Clicking an
// earlier file opens it; `level` says how far up the chain the open file is.
const props = defineProps({
  contextRid: { type: String, default: null }, // the file the chain is shown for
  selectedRid: { type: String, default: null }, // the file open now
  level: { type: Number, default: 0 },
  compareRid: { type: String, default: null }, // the file shown beside the open one
  sideBySide: { type: Boolean, default: false },
})

const collapsed = defineModel('collapsed', { type: Boolean, default: false })
const emit = defineEmits(['open', 'toggle-side-by-side'])

const path = ref([])
const nodes = computed(() => visibleLineage(path.value))

watch(
  () => props.contextRid,
  async (rid) => {
    path.value = rid ? (await getNodePath(rid).catch(() => [])) || [] : []
  },
  { immediate: true },
)

function open(node) {
  if (isOpenable(node))
    emit('open', { node, offset: offsetInLineage(nodes.value, node['@rid'], props.contextRid) })
}
</script>

<template>
  <aside class="lineage" :class="{ 'lineage--collapsed': collapsed }" aria-label="Lineage">
    <header class="lineage__head">
      <template v-if="!collapsed">
        <span class="lineage__title">Lineage</span>
        <v-chip size="x-small" label variant="tonal">{{ levelLabel(level) }}</v-chip>
      </template>
      <v-btn
        v-if="!collapsed"
        icon="mdi-compare"
        size="x-small"
        :variant="sideBySide ? 'tonal' : 'text'"
        :color="sideBySide ? 'primary' : undefined"
        :aria-pressed="sideBySide"
        :aria-label="sideBySide ? 'Open files in place' : 'Open files side by side'"
        :title="
          sideBySide
            ? 'Side by side: a picked file opens beside this one. Click to replace instead.'
            : 'Replace: a picked file replaces this one. Click to open side by side.'
        "
        class="lineage__toggle"
        @click="emit('toggle-side-by-side')"
      />
      <v-btn
        :icon="collapsed ? 'mdi-chevron-right' : 'mdi-chevron-left'"
        size="x-small"
        variant="text"
        :aria-label="collapsed ? 'Show lineage' : 'Hide lineage'"
        class="lineage__toggle"
        @click="collapsed = !collapsed"
      />
    </header>

    <ol v-if="!collapsed && nodes.length" class="lineage__list">
      <li
        v-for="node in nodes"
        :key="node['@rid']"
        class="lineage__item"
        :class="{
          'lineage__item--current': node['@rid'] === selectedRid,
          'lineage__item--compare': node['@rid'] === compareRid,
          'lineage__item--open': isOpenable(node),
          'lineage__item--removed': isRemoved(node),
        }"
      >
        <component
          :is="isOpenable(node) ? 'button' : 'div'"
          :type="isOpenable(node) ? 'button' : undefined"
          class="lineage__node"
          @click="open(node)"
        >
          <span class="lineage__kind">
            <v-icon :icon="nodeIcon(node)" :color="nodeColour(node)" size="14" aria-hidden="true" />
            {{ nodeKind(node) }}
          </span>
          <span class="lineage__label" :title="node.label">{{ node.label }}</span>
          <span v-if="isRemoved(node)" class="lineage__removed">File deleted after splitting</span>
          <ThumbnailImage
            v-if="node.type === 'image' && node.path"
            :src="previewUrl(node.path)"
            lazy
            compact
            class="lineage__thumb"
          />
        </component>
      </li>
    </ol>
    <p v-else-if="!collapsed" class="lineage__empty">No lineage</p>
  </aside>
</template>

<style scoped>
.lineage {
  width: calc(var(--md-card-min-width) * 0.8);
  height: 100%;
  overflow-y: auto;
  border-inline-end: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.lineage--collapsed {
  width: var(--md-space-7);
  overflow: hidden;
}

.lineage__head {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-2) var(--md-space-3);
  border-bottom: 1px solid var(--md-color-border);
}

.lineage__title {
  font-size: var(--md-font-size-xs);
  font-weight: var(--md-font-weight-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--md-color-text-muted);
}

.lineage__toggle {
  margin-inline-start: auto;
}

.lineage__toggle + .lineage__toggle {
  margin-inline-start: 0;
}

.lineage__list {
  margin: 0;
  padding: var(--md-space-3) var(--md-space-2);
  list-style: none;
}

.lineage__item {
  position: relative;
  padding-inline-start: var(--md-space-4);
  border-inline-start: 2px solid var(--md-color-border);
  margin-inline-start: var(--md-space-2);
}

.lineage__item::before {
  content: '';
  position: absolute;
  top: var(--md-space-3);
  left: calc(var(--md-space-1) * -1.5 - 1px);
  width: var(--md-space-2);
  height: var(--md-space-2);
  border-radius: 50%;
  background: var(--md-color-border);
}

.lineage__item--compare::before {
  background: var(--md-color-secondary, var(--md-color-primary));
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--md-color-secondary, var(--md-color-primary)) 25%, transparent);
}

.lineage__item--current::before {
  background: var(--md-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--md-color-primary) 25%, transparent);
}

.lineage__node {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-1);
  width: 100%;
  margin-block-end: var(--md-space-1);
  padding: var(--md-space-1) var(--md-space-2);
  border: 0;
  border-radius: var(--md-radius-sm);
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
}

.lineage__item--open .lineage__node {
  cursor: pointer;
}

.lineage__item--open .lineage__node:hover,
.lineage__item--compare .lineage__node,
.lineage__item--current .lineage__node {
  background: color-mix(in srgb, var(--md-color-primary) 7%, transparent);
}

.lineage__kind {
  font-size: var(--md-font-size-xs);
  font-weight: var(--md-font-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--md-color-text-muted);
}

.lineage__label {
  overflow: hidden;
  font-size: var(--md-font-size-sm);
  font-weight: var(--md-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lineage__item--removed .lineage__node {
  cursor: not-allowed;
}

.lineage__item--removed .lineage__kind,
.lineage__item--removed .lineage__label {
  opacity: 0.55;
}

.lineage__item--removed .lineage__label {
  text-decoration: line-through;
}

.lineage__removed {
  color: var(--md-color-warning);
  font-size: var(--md-font-size-xs);
}

.lineage__thumb {
  max-width: 100%;
  border-radius: var(--md-radius-sm);
  border: 1px solid var(--md-color-border);
}

.lineage__empty {
  padding: var(--md-space-3);
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-xs);
}
</style>
