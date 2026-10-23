<script setup>
import { computed, onMounted, reactive } from 'vue'
import { getPrompts, savePrompt } from '@/api/services.js'
import PageHeader from '@/ui/PageHeader.vue'
import SectionCard from '@/ui/SectionCard.vue'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import PromptDialog from './PromptDialog.vue'

// Library of reusable prompts for the AI crunchers, grouped by input type.
const SECTIONS = [
  { type: 'image', title: 'Image to text', icon: 'mdi-image-outline' },
  { type: 'text', title: 'Text to text', icon: 'mdi-text' },
]

const state = reactive({
  prompts: [],
  loading: true,
  error: null,
  dialog: { open: false, prompt: null, newType: 'text' },
})

const byType = computed(() => {
  const groups = {}
  for (const prompt of state.prompts) (groups[prompt.type] ??= []).push(prompt)
  return groups
})

async function load() {
  try {
    state.prompts = (await getPrompts()) || []
    state.error = null
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
}

function openPrompt(prompt) {
  Object.assign(state.dialog, { open: true, prompt, newType: prompt.type })
}

function newPrompt(type) {
  Object.assign(state.dialog, { open: true, prompt: null, newType: type })
}

async function save(prompt) {
  await savePrompt(prompt)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="prompts-page">
    <PageHeader
      title="Prompts"
      subtitle="Reusable instructions for the AI crunchers, with text or structured JSON output."
    />
    <ErrorAlert
      :error="state.error"
      title="Could not load prompts"
      retryable
      class="mb-4"
      @retry="load"
    />
    <LoadingState v-if="state.loading" text="Loading prompts…" />

    <div v-else class="prompts-page__sections">
      <SectionCard v-for="section in SECTIONS" :key="section.type" :title="section.title">
        <div class="prompts-page__grid">
          <v-card
            v-for="prompt in byType[section.type] || []"
            :key="prompt['@rid'] || prompt.name"
            rounded="lg"
            flat
            class="prompt-card"
            @click="openPrompt(prompt)"
          >
            <v-card-item>
              <v-card-title class="prompt-card__title">
                <v-icon
                  :icon="section.icon"
                  size="small"
                  color="primary"
                  class="me-2"
                  aria-hidden="true"
                />
                {{ prompt.name }}
              </v-card-title>
              <v-card-subtitle v-if="prompt.description" class="prompt-card__subtitle">
                {{ prompt.description }}
              </v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <p class="prompt-card__content">{{ prompt.content }}</p>
              <v-chip
                :color="prompt.output_type === 'json' ? 'warning' : 'success'"
                size="small"
                variant="tonal"
                label
              >
                {{ prompt.output_type === 'json' ? 'JSON output' : 'Text output' }}
              </v-chip>
            </v-card-text>
          </v-card>

          <button type="button" class="prompts-page__add" @click="newPrompt(section.type)">
            <v-icon icon="mdi-plus" aria-hidden="true" />
            Add {{ section.title.toLowerCase() }} prompt
          </button>
        </div>
      </SectionCard>
    </div>

    <PromptDialog
      v-model="state.dialog.open"
      :prompt="state.dialog.prompt"
      :new-type="state.dialog.newType"
      :save="save"
    />
  </div>
</template>

<style scoped>
.prompts-page {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-7);
}

.prompts-page__sections {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-5);
}

.prompts-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--md-card-min-width), 1fr));
  gap: var(--md-space-4);
}

.prompt-card {
  border: 1px solid var(--md-color-border);
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.prompt-card:hover {
  border-color: var(--md-color-primary);
  box-shadow: var(--md-shadow-2);
}

.prompt-card__title {
  display: flex;
  align-items: center;
  white-space: normal;
  font-weight: var(--md-font-weight-bold);
}

.prompt-card__subtitle {
  white-space: normal;
}

.prompt-card__content {
  display: -webkit-box;
  margin: 0 0 var(--md-space-3);
  padding: var(--md-space-2) var(--md-space-3);
  overflow: hidden;
  border-radius: var(--md-radius-sm);
  background: var(--md-color-bg);
  font-family: var(--md-font-mono);
  font-size: var(--md-font-size-xs);
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.prompts-page__add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--md-space-2);
  min-height: calc(var(--md-space-7) * 3);
  border: 2px dashed var(--md-color-border);
  border-radius: var(--md-radius-lg);
  background: transparent;
  color: var(--md-color-text-muted);
  font: inherit;
  cursor: pointer;
}

.prompts-page__add:hover,
.prompts-page__add:focus-visible {
  border-color: var(--md-color-primary);
  color: var(--md-color-primary);
}
</style>
