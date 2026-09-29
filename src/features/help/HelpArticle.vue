<script setup>
// Renders a help article (already sanitised) with the app's typography and
// the help pages' own blocks: columns, notes, tips, warnings and stamps.
defineProps({ html: { type: String, required: true } })
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- html is sanitised by parseHelpPage -->
  <article class="help-article" v-html="html" />
</template>

<style scoped>
.help-article {
  font-size: var(--md-font-size-md);
  line-height: 1.65;
  color: var(--md-color-text);
}

.help-article :deep(h2) {
  margin: var(--md-space-6) 0 var(--md-space-3);
  font-size: var(--md-font-size-2xl);
}

.help-article :deep(h2:first-child) {
  margin-top: 0;
}

.help-article :deep(h3) {
  margin: var(--md-space-5) 0 var(--md-space-2);
  font-size: var(--md-font-size-xl);
}

.help-article :deep(p),
.help-article :deep(ul),
.help-article :deep(ol) {
  margin: 0 0 var(--md-space-3);
}

.help-article :deep(ul),
.help-article :deep(ol) {
  padding-inline-start: var(--md-space-5);
}

.help-article :deep(a) {
  color: var(--md-color-primary);
}

.help-article :deep(img) {
  display: block;
  margin: var(--md-space-4) 0;
  border-radius: var(--md-radius-md);
  border: 1px solid var(--md-color-border);
}

.help-article :deep(code) {
  padding: 0 var(--md-space-1);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-bg);
  font-size: 0.9em;
}

.help-article :deep(pre) {
  padding: var(--md-space-3);
  border-radius: var(--md-radius-md);
  background: var(--md-color-bg);
  overflow-x: auto;
}

/* Columns: the page sets --md-columns (and --md-columns-medium) inline. */
.help-article :deep(.md-columns) {
  display: grid;
  grid-template-columns: repeat(var(--md-columns, 2), minmax(0, 1fr));
  gap: var(--md-space-4);
  margin: var(--md-space-5) 0;
}

@media (max-width: 1100px) {
  .help-article :deep(.md-columns) {
    grid-template-columns: repeat(var(--md-columns-medium, 2), minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .help-article :deep(.md-columns) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.help-article :deep(.md-column) {
  padding: var(--md-space-4);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-md);
  background: var(--md-color-bg);
}

.help-article :deep(.md-column > :first-child) {
  margin-top: 0;
}

.help-article :deep(.md-column > :last-child) {
  margin-bottom: 0;
}

/* Notes, tips and warnings */
.help-article :deep(blockquote),
.help-article :deep(.md-note) {
  --callout: var(--md-color-teal);
  margin: var(--md-space-4) 0;
  padding: var(--md-space-3) var(--md-space-4);
  border: 1px solid color-mix(in srgb, var(--callout) 30%, transparent);
  border-inline-start: 4px solid var(--callout);
  border-radius: var(--md-radius-md);
  background: color-mix(in srgb, var(--callout) 7%, var(--md-color-surface));
}

.help-article :deep(.md-note) {
  --callout: var(--md-color-primary);
}

.help-article :deep(blockquote.md-warning) {
  --callout: var(--md-color-warning);
}

.help-article :deep(blockquote p),
.help-article :deep(.md-note p) {
  margin: 0;
}

.help-article :deep(.md-note-title) {
  margin: 0 0 var(--md-space-1);
  font-size: var(--md-font-size-xs);
  font-weight: var(--md-font-weight-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--md-color-primary);
}

.help-article :deep(.md-tip-icon),
.help-article :deep(.md-warning-icon) {
  margin-inline-end: var(--md-space-1);
}

/* Stamps: a small label marking what kind of method a tool uses. */
.help-article :deep(.md-stamp-inline),
.help-article :deep(blockquote.md-stamp) {
  --stamp: var(--md-color-teal);
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-1) var(--md-space-3);
  border: 2px solid var(--stamp);
  border-radius: var(--md-radius-sm);
  color: var(--stamp);
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-xs);
  font-weight: var(--md-font-weight-medium);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transform: rotate(-1.5deg);
}

.help-article :deep(.md-stamp-green) {
  --stamp: var(--md-color-success);
}

.help-article :deep(.md-stamp-red) {
  --stamp: var(--md-color-error);
}

.help-article :deep(.md-stamp-orange) {
  --stamp: var(--md-color-warning);
}

.help-article :deep(.md-stamp-blue) {
  --stamp: var(--md-color-primary);
}

.help-article :deep(.md-stamp-seal) {
  width: 0.75em;
  height: 0.75em;
  border-radius: 50%;
  background: var(--stamp);
}
</style>
