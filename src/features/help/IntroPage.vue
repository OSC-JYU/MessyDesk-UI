<script setup>
import { ref } from 'vue'
import PageHeader from '@/ui/PageHeader.vue'
import { introSlides } from './introSlides.js'

const current = ref(0)
const last = introSlides.length - 1
</script>

<template>
  <div class="intro-page">
    <PageHeader
      title="Introduction"
      subtitle="A short tour of what MessyDesk is and why it looks the way it does."
    >
      <template #actions>
        <v-btn variant="text" prepend-icon="mdi-help-circle-outline" :to="{ name: 'help' }">
          Help and tutorials
        </v-btn>
      </template>
    </PageHeader>

    <v-window v-model="current" class="intro-window">
      <v-window-item v-for="(slide, index) in introSlides" :key="slide.title" :value="index">
        <section class="intro-slide" :aria-label="`Step ${index + 1} of ${introSlides.length}`">
          <v-img :src="slide.image" :alt="slide.imageAlt" class="intro-slide__image" cover />
          <h2 class="intro-slide__title">{{ index + 1 }}. {{ slide.title }}</h2>
          <p class="intro-slide__lead">{{ slide.lead }}</p>
          <div class="intro-slide__cards">
            <v-card
              v-for="card in slide.cards"
              :key="card.title"
              rounded="lg"
              flat
              class="intro-card"
            >
              <v-card-item>
                <v-card-title class="intro-card__title">{{ card.title }}</v-card-title>
                <v-card-subtitle
                  v-for="line in card.subtitle"
                  :key="line"
                  class="intro-card__subtitle"
                >
                  {{ line }}
                </v-card-subtitle>
              </v-card-item>
              <v-card-text v-if="card.paragraphs.length">
                <p v-for="paragraph in card.paragraphs" :key="paragraph">{{ paragraph }}</p>
              </v-card-text>
            </v-card>
          </div>
        </section>
      </v-window-item>
    </v-window>

    <nav class="intro-nav" aria-label="Introduction steps">
      <v-btn
        variant="text"
        prepend-icon="mdi-chevron-left"
        :disabled="current === 0"
        @click="current--"
      >
        Previous
      </v-btn>
      <div class="intro-nav__steps">
        <button
          v-for="(slide, index) in introSlides"
          :key="slide.title"
          type="button"
          class="intro-nav__step"
          :class="{ 'intro-nav__step--active': index === current }"
          :aria-label="`Step ${index + 1}: ${slide.title}`"
          :aria-current="index === current ? 'step' : undefined"
          @click="current = index"
        />
      </div>
      <v-btn
        v-if="current < last"
        variant="flat"
        color="primary"
        append-icon="mdi-chevron-right"
        @click="current++"
      >
        Next
      </v-btn>
      <v-btn v-else variant="flat" color="primary" :to="{ name: 'Home' }">Go to your desks</v-btn>
    </nav>
  </div>
</template>

<style scoped>
.intro-page {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-7);
}

.intro-slide__image {
  max-height: var(--md-media-max-height);
  border-radius: var(--md-radius-lg);
  border: 1px solid var(--md-color-border);
}

.intro-slide__title {
  margin: var(--md-space-5) 0 var(--md-space-1);
  font-size: var(--md-font-size-2xl);
  text-align: center;
}

.intro-slide__lead {
  margin: 0 0 var(--md-space-5);
  text-align: center;
  color: var(--md-color-text-muted);
}

.intro-slide__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--md-card-min-width), 1fr));
  gap: var(--md-space-4);
}

.intro-card {
  border: 1px solid var(--md-color-border);
}

.intro-card__title {
  font-weight: var(--md-font-weight-bold);
  white-space: normal;
}

.intro-card__subtitle {
  white-space: normal;
}

.intro-card p {
  margin: 0 0 var(--md-space-2);
}

.intro-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-4);
  margin-block-start: var(--md-space-6);
}

.intro-nav__steps {
  display: flex;
  gap: var(--md-space-2);
}

.intro-nav__step {
  width: var(--md-space-3);
  height: var(--md-space-3);
  padding: 0;
  border: 0;
  border-radius: var(--md-radius-pill);
  background: var(--md-color-border);
  cursor: pointer;
}

.intro-nav__step--active {
  background: var(--md-color-primary);
}
</style>
