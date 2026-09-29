<script setup>
import { ref } from 'vue'
import PageHeader from '@/ui/PageHeader.vue'
import SectionCard from '@/ui/SectionCard.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import CrunchIcon from '@/ui/CrunchIcon.vue'
import { settings, saveSetting, THEME_OPTIONS, COOKIE_OPTIONS } from '@/stores/settings.js'

// The user's own settings: theme and the colour of the cruncher cookie. A
// choice applies at once and is saved to the user's account.
const error = ref(null)
const saved = ref(false)

// Each theme card previews itself: tokens.css defines the colours for any
// element with a data-theme attribute.
const previewThemes = { light: ['fjord'], dark: ['fjord-dark'], system: ['fjord', 'fjord-dark'] }

async function choose(key, value) {
  if (settings[key] === value) return
  error.value = null
  saved.value = false
  try {
    await saveSetting(key, value)
    saved.value = true
  } catch (e) {
    error.value = e
  }
}
</script>

<template>
  <div class="settings-page">
    <PageHeader title="Settings" subtitle="How MessyDesk looks for you">
      <template #actions>
        <v-fade-transition>
          <span v-if="saved" class="settings-page__saved" role="status">
            <v-icon icon="mdi-check" size="18" aria-hidden="true" /> Saved
          </span>
        </v-fade-transition>
      </template>
    </PageHeader>

    <ErrorAlert :error="error" title="The setting was not saved" class="mb-4" />

    <div class="settings-page__sections">
      <SectionCard title="Theme" overline="Appearance">
        <div class="settings-options" role="radiogroup" aria-label="Theme">
          <label
            v-for="option in THEME_OPTIONS"
            :key="option.value"
            class="settings-option"
            :class="{ 'settings-option--selected': settings.theme === option.value }"
          >
            <input
              type="radio"
              name="theme"
              class="d-sr-only"
              :value="option.value"
              :checked="settings.theme === option.value"
              @change="choose('theme', option.value)"
            />
            <span class="theme-preview" aria-hidden="true">
              <span
                v-for="theme in previewThemes[option.value]"
                :key="theme"
                :data-theme="theme"
                class="theme-preview__half"
              >
                <span class="theme-preview__bar" />
                <span class="theme-preview__card">
                  <span class="theme-preview__line" />
                  <span class="theme-preview__line theme-preview__line--short" />
                  <span class="theme-preview__button" />
                </span>
              </span>
            </span>
            <span class="settings-option__title">
              <v-icon :icon="option.icon" size="18" aria-hidden="true" />
              {{ option.title }}
            </span>
          </label>
        </div>
      </SectionCard>

      <SectionCard title="Cruncher cookie" overline="Appearance">
        <p class="settings-page__hint">
          The cookie on files and sets opens the crunchers. Pick its flavour.
        </p>
        <div
          class="settings-options settings-options--cookies"
          role="radiogroup"
          aria-label="Cookie colour"
        >
          <label
            v-for="option in COOKIE_OPTIONS"
            :key="option.value"
            class="settings-option settings-option--cookie"
            :class="{ 'settings-option--selected': settings.cookie === option.value }"
            :data-cookie="option.value"
          >
            <input
              type="radio"
              name="cookie"
              class="d-sr-only"
              :value="option.value"
              :checked="settings.cookie === option.value"
              @change="choose('cookie', option.value)"
            />
            <CrunchIcon :size="48" :plus="false" />
            <span class="settings-option__title">{{ option.title }}</span>
          </label>
        </div>
      </SectionCard>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-7);
}

.settings-page__sections {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-5);
}

.settings-page__saved {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  color: var(--md-color-success);
  font-weight: var(--md-font-weight-medium);
}

.settings-page__hint {
  color: var(--md-color-text-muted);
}

.settings-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--md-card-min-width), 1fr));
  gap: var(--md-space-4);
}

.settings-options--cookies {
  grid-template-columns: repeat(auto-fill, minmax(var(--md-swatch-min-width), 1fr));
}

.settings-option {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-3);
  padding: var(--md-space-3);
  border: 2px solid var(--md-color-border);
  border-radius: var(--md-radius-lg);
  background: var(--md-color-surface);
  cursor: pointer;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.settings-option:hover {
  border-color: var(--md-color-primary);
}

.settings-option:has(input:focus-visible) {
  outline: 2px solid var(--md-color-focus);
  outline-offset: 2px;
}

.settings-option--selected {
  border-color: var(--md-color-primary);
  box-shadow: var(--md-shadow-2);
}

.settings-option--cookie {
  align-items: center;
  padding-block: var(--md-space-4);
}

.settings-option__title {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-2);
  font-weight: var(--md-font-weight-medium);
}

.settings-option--selected .settings-option__title {
  color: var(--md-color-primary);
}

/* A small picture of the app in the theme: header bar, a card and a button. */
.theme-preview {
  display: flex;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-md);
}

.theme-preview__half {
  display: flex;
  flex: 1;
  flex-direction: column;
  background: var(--md-color-bg);
}

.theme-preview__bar {
  height: 18%;
  background: var(--md-color-header);
}

.theme-preview__card {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--md-space-1);
  margin: 10%;
  padding: 8%;
  border-radius: var(--md-radius-sm);
  background: var(--md-color-surface);
  box-shadow: var(--md-shadow-1);
}

.theme-preview__line {
  height: var(--md-space-1);
  border-radius: var(--md-radius-sm);
  background: var(--md-color-text-muted);
  opacity: 0.5;
}

.theme-preview__line--short {
  width: 60%;
}

.theme-preview__button {
  width: 40%;
  height: var(--md-space-2);
  margin-block-start: auto;
  border-radius: var(--md-radius-sm);
  background: var(--md-color-primary);
}
</style>
