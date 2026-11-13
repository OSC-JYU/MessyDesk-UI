<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import SectionCard from '@/ui/SectionCard.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import { demoCoverUrl } from '@/api/demos.js'
import { pickText } from './demos.js'

// "Learn MessyDesk": ready-made desks the user can copy and try. Importing never runs a
// service, so the copy shows the finished work and is an ordinary desk afterwards.
// Nothing is shown when no demo is shared with the user.
const props = defineProps({
  demos: { type: Array, required: true },
  // Id of the demo being copied right now, or ''.
  importing: { type: String, default: '' },
  // { <demo id>: route rid of the desk it was copied to }, for demos copied in this visit.
  copied: { type: Object, default: () => ({}) },
  error: { type: [String, Object], default: null },
})
const emit = defineEmits(['copy', 'hide'])

const { locale } = useI18n()
const cards = computed(() =>
  props.demos.map((demo) => ({
    ...demo,
    titleText: pickText(demo.title, locale.value),
    descriptionText: pickText(demo.description, locale.value),
    cover: demo.has_cover ? demoCoverUrl(demo) : '',
  })),
)
</script>

<template>
  <SectionCard
    v-if="demos.length || error"
    overline="Learn MessyDesk"
    title="Try a ready-made desk"
  >
    <p class="learn__hint">
      These desks are finished examples. Open one as your own copy, look around and change anything
      you like.
    </p>
    <ErrorAlert :error="error" title="Could not copy the desk" class="mb-3" />
    <v-checkbox
      label="Hide demo desks"
      hide-details
      density="compact"
      class="learn__hide"
      :model-value="false"
      @update:model-value="emit('hide')"
    />
    <ul class="learn__grid">
      <li v-for="demo in cards" :key="demo.id" class="learn__item">
        <v-card class="learn__card" variant="outlined" rounded="lg">
          <v-img
            v-if="demo.cover"
            :src="demo.cover"
            :alt="demo.titleText"
            aspect-ratio="16/9"
            cover
          />
          <div v-else class="learn__placeholder" aria-hidden="true">
            <v-icon icon="mdi-school-outline" size="48" />
          </div>
          <v-card-title class="learn__title">{{ demo.titleText }}</v-card-title>
          <v-card-text v-if="demo.descriptionText" class="learn__text">
            {{ demo.descriptionText }}
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              :variant="copied[demo.id] ? 'tonal' : 'flat'"
              size="small"
              :prepend-icon="copied[demo.id] ? 'mdi-check' : 'mdi-content-copy'"
              :loading="importing === demo.id"
              :disabled="Boolean(copied[demo.id]) || (Boolean(importing) && importing !== demo.id)"
              @click="emit('copy', demo)"
            >
              {{ copied[demo.id] ? 'Copied to your desks' : 'Copy to my desks' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </li>
    </ul>
  </SectionCard>
</template>

<style scoped>
.learn__hint {
  margin: 0 0 var(--md-space-4);
  color: var(--md-color-text-muted);
}

.learn__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--md-card-min-width), 1fr));
  gap: var(--md-space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.learn__card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.learn__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  background: var(--md-color-surface-subtle);
  color: var(--md-color-primary);
}

.learn__title {
  white-space: normal;
  font-family: var(--md-font-title);
}

.learn__text {
  flex: 1;
  color: var(--md-color-text-muted);
}
</style>
