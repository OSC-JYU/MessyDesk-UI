<script setup>
import ThumbnailImage from '@/ui/ThumbnailImage.vue'

// One file in a results grid: name, tags, a thumbnail for images and PDFs,
// and the matching text.
defineProps({ result: { type: Object, required: true } })
defineEmits(['open'])

const isPdf = (type) => type === 'pdf' || type === 'original-pdf'
</script>

<template>
  <button
    type="button"
    class="result-card"
    :class="{ 'result-card--group': result.group }"
    :title="`${result.group ? 'Show the pages of' : 'Open'} ${result.label}`"
    @click="$emit('open')"
  >
    <span class="result-card__label">{{ result.label }}</span>
    <span v-if="result.entities.length || result.badge || result.passages" class="result-card__tags">
      <v-chip v-if="result.badge" size="x-small" color="warning" variant="flat" label>{{
        result.badge
      }}</v-chip>
      <v-chip
        v-if="result.passages"
        size="x-small"
        variant="tonal"
        label
        prepend-icon="mdi-format-quote-close"
        :title="`${result.passages} coded passages`"
      >
        {{ result.passages }}
      </v-chip>
      <v-chip
        v-for="entity in result.entities"
        :key="entity.id || entity['@rid'] || entity.label"
        :color="entity.color"
        :prepend-icon="entity.icon ? `mdi-${String(entity.icon).toLowerCase()}` : undefined"
        size="x-small"
        label
      >
        {{ entity.label }}
      </v-chip>
    </span>
    <ThumbnailImage
      v-if="result.thumb && (result.type === 'image' || isPdf(result.type))"
      :src="result.thumb"
      lazy
      class="result-card__thumb"
    />
    <v-icon
      v-else-if="isPdf(result.type)"
      icon="mdi-file-pdf-box"
      size="48"
      class="result-card__icon"
    />
    <!-- snippetHtml is escaped except for Solr's <em> highlights (results.js) -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <span v-if="result.snippetHtml" class="result-card__snippet" v-html="result.snippetHtml" />
    <span v-else-if="result.text" class="result-card__text">{{ result.text }}</span>
  </button>
</template>

<style scoped>
.result-card {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
  width: 100%;
  height: 100%;
  padding: 0 0 var(--md-space-3);
  overflow: hidden;
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-md);
  background: var(--md-color-surface);
  color: var(--md-color-text);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

/* a group of files (the pages of one PDF): drawn as a stack */
.result-card--group {
  box-shadow:
    3px 3px 0 var(--md-color-surface),
    4px 4px 0 var(--md-color-border),
    7px 7px 0 var(--md-color-surface),
    8px 8px 0 var(--md-color-border);
}

.result-card:hover,
.result-card:focus-visible {
  border-color: var(--md-color-primary);
  box-shadow: var(--md-shadow-2);
}

.result-card__label {
  padding: var(--md-space-2) var(--md-space-3);
  overflow: hidden;
  border-bottom: 1px solid var(--md-color-border);
  background: var(--md-color-bg);
  font-size: var(--md-font-size-sm);
  font-weight: var(--md-font-weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
  padding: 0 var(--md-space-3);
}

.result-card__thumb {
  align-self: center;
  max-height: var(--md-media-max-height);
  object-fit: contain;
}

.result-card__icon {
  align-self: center;
  color: var(--md-color-error);
}

.result-card__snippet,
.result-card__text {
  display: -webkit-box;
  padding: 0 var(--md-space-3);
  overflow: hidden;
  font-size: var(--md-font-size-sm);
  white-space: pre-wrap;
  -webkit-line-clamp: 8;
  -webkit-box-orient: vertical;
}

.result-card__snippet :deep(em) {
  padding: 0 var(--md-space-1);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-highlight);
  font-style: normal;
  font-weight: var(--md-font-weight-bold);
}
</style>
