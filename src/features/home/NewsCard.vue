<script setup>
import SectionCard from '@/ui/SectionCard.vue'

const news = [
  {
    title: 'New version of MessyDesk released!',
    date: '2026-05-29',
    text: 'Same UI but a lot of changes under the hood.',
  },
]
</script>

<template>
  <SectionCard overline="Updates" title="News">
    <article v-for="item in news" :key="item.title" class="news__item">
      <time :datetime="item.date" class="news__date">
        {{ new Date(item.date).toLocaleDateString() }}
      </time>
      <h3 class="news__title">{{ item.title }}</h3>
      <p class="news__text">{{ item.text }}</p>
    </article>
  </SectionCard>
</template>

<style scoped>
.news__item {
  padding-inline-start: var(--md-space-3);
  border-inline-start: 2px solid var(--md-color-teal);
}

.news__date {
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.news__title {
  margin: var(--md-space-1) 0;
  font-family: var(--md-font-body) !important;
  font-size: var(--md-font-size-md);
  font-weight: var(--md-font-weight-medium);
}

.news__text {
  margin: 0;
}
</style>
