<script setup>
import PageHeader from '@/ui/PageHeader.vue'

const links = [
  {
    title: 'Get started',
    icon: 'mdi-compass-outline',
    items: [
      { label: 'Introduction', to: { name: 'introduction' } },
      { label: 'Help and tutorials', to: { name: 'help' } },
      { label: 'Design principles', to: { name: 'help', params: { slug: 'principles' } } },
    ],
  },
  {
    title: 'Source code',
    icon: 'mdi-github',
    items: [
      { label: 'MessyDesk (backend)', href: 'https://github.com/OSC-JYU/MessyDesk' },
      { label: 'MessyDesk UI', href: 'https://github.com/OSC-JYU/MessyDesk-UI' },
    ],
  },
]
</script>

<template>
  <div class="about-page">
    <PageHeader
      title="About MessyDesk"
      subtitle="Visual processing tools for image and textual data"
    />

    <v-card rounded="lg" flat class="about-card">
      <p>
        MessyDesk is built specifically to support academic research, which brings requirements for
        data handling, reproducibility and methodology.
      </p>
      <p>
        Every file you add and every processing step you run is a node on your desk, linked to what
        it came from. That way you can always trace a result back to its original source.
      </p>
      <p class="about-card__credit">
        Developed by the Open Science Centre at the University of Jyväskylä.
      </p>
    </v-card>

    <div class="about-links">
      <v-card v-for="group in links" :key="group.title" rounded="lg" flat class="about-card">
        <v-card-title class="about-links__title">
          <v-icon :icon="group.icon" size="small" class="me-2" aria-hidden="true" />
          {{ group.title }}
        </v-card-title>
        <v-list density="compact" class="pa-0">
          <v-list-item
            v-for="item in group.items"
            :key="item.label"
            :to="item.to"
            :href="item.href"
            :target="item.href ? '_blank' : undefined"
            :append-icon="item.href ? 'mdi-open-in-new' : 'mdi-chevron-right'"
            :title="item.label"
          />
        </v-list>
      </v-card>
    </div>

    <p class="about-page__image-credit">Background illustration by BiancaVanDijk.</p>
  </div>
</template>

<style scoped>
.about-page {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-7);
}

.about-card {
  padding: var(--md-space-4) var(--md-space-5);
  border: 1px solid var(--md-color-border);
  font-size: var(--md-font-size-md);
}

.about-card p {
  margin: 0 0 var(--md-space-3);
  max-width: 72ch;
}

.about-card__credit {
  color: var(--md-color-text-muted);
}

.about-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(var(--md-card-min-width), 1fr));
  gap: var(--md-space-4);
  margin-block-start: var(--md-space-4);
}

.about-links__title {
  display: flex;
  align-items: center;
  padding: 0 0 var(--md-space-2);
  font-weight: var(--md-font-weight-bold);
}

.about-page__image-credit {
  margin: var(--md-space-5) 0 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
