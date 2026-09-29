<script setup>
import { computed } from 'vue'
import DescriptionField from './DescriptionField.vue'
import FileTagsTool from './FileTagsTool.vue'
import QuickEditTool from './QuickEditTool.vue'
import { fileUrl } from '../fileUrls.js'
import { isImage, isTextLike } from '../fileTypes.js'

// Right-hand panel of the file viewer: file details, tags, quick edits and
// display options.
const props = defineProps({
  file: { type: Object, required: true },
  edit: { type: Object, required: true },
  canEditText: { type: Boolean, default: false },
})

const collapsed = defineModel('collapsed', { type: Boolean, default: false })
const markdown = defineModel('markdown', { type: Boolean, default: false })
const emit = defineEmits(['refresh', 'file-updated', 'quick-edit'])

const showQuickEdit = computed(
  () => isImage(props.file) || isTextLike(props.file) || props.file.edited,
)
</script>

<template>
  <aside class="tools" :class="{ 'tools--collapsed': collapsed }" aria-label="File tools">
    <header class="tools__head">
      <v-btn
        :icon="collapsed ? 'mdi-chevron-left' : 'mdi-chevron-right'"
        size="x-small"
        variant="text"
        :aria-label="collapsed ? 'Show tools' : 'Hide tools'"
        @click="collapsed = !collapsed"
      />
      <span v-if="!collapsed" class="tools__title">Tools</span>
    </header>

    <template v-if="!collapsed">
      <section class="tools__section">
        <h2 class="tools__file">{{ file.label }}</h2>
        <v-chip v-if="file.edited" size="x-small" color="warning" variant="tonal" label class="mb-2"
          >Quick edit</v-chip
        >
        <DescriptionField :rid="file['@rid']" :description="file.description" />
        <dl v-if="file.metadata" class="tools__meta">
          <template v-if="file.metadata.size"
            ><dt>Size</dt>
            <dd>{{ file.metadata.size }} MB</dd></template
          >
          <template v-if="file.metadata.width"
            ><dt>Pixels</dt>
            <dd>{{ file.metadata.width }} × {{ file.metadata.height }}</dd></template
          >
          <template v-if="file.metadata.lines"
            ><dt>Text</dt>
            <dd>
              {{ file.metadata.lines }} lines, {{ file.metadata.characters }} characters
            </dd></template
          >
        </dl>
        <div class="tools__buttons">
          <v-btn
            :href="fileUrl(file['@rid'])"
            target="_blank"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-open-in-new"
            >Open file</v-btn
          >
          <v-btn size="small" variant="text" prepend-icon="mdi-refresh" @click="emit('refresh')"
            >Refresh</v-btn
          >
        </div>
      </section>

      <v-expansion-panels multiple variant="accordion" class="tools__panels">
        <v-expansion-panel value="tags">
          <v-expansion-panel-title>
            <v-icon icon="mdi-tag-outline" size="16" class="me-2" aria-hidden="true" />
            Tags
            <v-chip
              v-if="file.entities?.length"
              size="x-small"
              variant="tonal"
              color="primary"
              class="ms-2"
              >{{ file.entities.length }}</v-chip
            >
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <FileTagsTool :file="file" @file-updated="emit('file-updated', $event)" />
          </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel v-if="showQuickEdit" value="edit">
          <v-expansion-panel-title>
            <v-icon icon="mdi-history" size="16" class="me-2" aria-hidden="true" />
            Quick edits
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <QuickEditTool
              :file="file"
              :edit="edit"
              :can-edit-text="canEditText"
              @rotate="(degrees) => emit('quick-edit', 'rotate', degrees)"
              @start-crop="emit('quick-edit', 'start-crop')"
              @clear-crop="emit('quick-edit', 'clear-crop')"
              @cancel-crop="emit('quick-edit', 'cancel-crop')"
              @start-text="emit('quick-edit', 'start-text')"
              @cancel-text="emit('quick-edit', 'cancel-text')"
              @save="emit('quick-edit', 'save')"
              @revert="emit('quick-edit', 'revert')"
            />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <section v-if="canEditText" class="tools__section">
        <v-switch
          v-model="markdown"
          label="Show as Markdown"
          color="primary"
          density="compact"
          hide-details
          inset
        />
      </section>

      <v-alert
        v-if="edit.message"
        :type="edit.message.type"
        variant="tonal"
        density="compact"
        class="ma-3"
      >
        {{ edit.message.text }}
      </v-alert>
    </template>
  </aside>
</template>

<style scoped>
.tools {
  width: calc(var(--md-card-min-width) * 1.05);
  height: 100%;
  overflow-y: auto;
  border-inline-start: 1px solid var(--md-color-border);
  background: var(--md-color-surface);
}

.tools--collapsed {
  width: var(--md-space-7);
  overflow: hidden;
}

.tools__head {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  padding: var(--md-space-2) var(--md-space-3);
  border-bottom: 1px solid var(--md-color-border);
}

.tools__title {
  font-size: var(--md-font-size-xs);
  font-weight: var(--md-font-weight-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--md-color-text-muted);
}

.tools__section {
  padding: var(--md-space-3);
  border-bottom: 1px solid var(--md-color-border);
}

.tools__file {
  margin: 0 0 var(--md-space-2);
  font-family: var(--md-font-body) !important;
  font-size: var(--md-font-size-md);
  font-weight: var(--md-font-weight-bold);
  word-break: break-word;
}

.tools__meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0 var(--md-space-2);
  margin: var(--md-space-2) 0 0;
  font-size: var(--md-font-size-xs);
}

.tools__meta dt {
  color: var(--md-color-text-muted);
}

.tools__meta dd {
  margin: 0;
}

.tools__buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-2);
  margin-block-start: var(--md-space-3);
}

.tools__panels :deep(.v-expansion-panel) {
  border-radius: 0 !important;
}
</style>
