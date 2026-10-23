<script setup>
import { computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getHelp, getServiceHelp, getServiceHelpAsset } from '@/api/services.js'
import PageHeader from '@/ui/PageHeader.vue'
import LoadingState from '@/ui/LoadingState.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import HelpArticle from './HelpArticle.vue'
import { helpPath, parseHelpPage } from './helpContent.js'

const route = useRoute()
const router = useRouter()

const state = reactive({ loading: true, error: '', page: { nav: [], title: '', html: '' } })

const serviceId = computed(() => {
  const id = String(route.params.service || '').trim()
  return /^[a-z0-9][a-z0-9_-]*$/i.test(id) ? id : null
})

function slugFrom(raw) {
  const slug =
    String(raw || 'index')
      .trim()
      .toLowerCase() || 'index'
  return /^[a-z0-9-]+$/.test(slug) ? slug : null
}

function assetPathFrom(raw) {
  const path = (Array.isArray(raw) ? raw.join('/') : String(raw || '')).trim().replace(/^\/+/, '')
  if (!path || path.includes('..') || !/^[a-zA-Z0-9._/-]+$/.test(path)) return null
  return path
}

async function fetchPage() {
  if (route.params.service !== undefined) {
    if (!serviceId.value) throw { status: 400, message: 'Invalid service help address.' }
    const asset = assetPathFrom(route.params.assetPath)
    return asset ? getServiceHelpAsset(serviceId.value, asset) : getServiceHelp(serviceId.value)
  }
  const slug = slugFrom(route.params.slug)
  if (!slug) throw { status: 400, message: 'Invalid help page address.' }
  return getHelp(slug)
}

async function load() {
  state.loading = true
  state.error = ''
  try {
    state.page = parseHelpPage(await fetchPage())
  } catch (error) {
    state.page = { nav: [], title: '', html: '' }
    state.error =
      error?.status === 404
        ? serviceId.value
          ? 'This service has no help page yet.'
          : 'Help page not found.'
        : error?.message || 'Failed to load the help page.'
  } finally {
    state.loading = false
  }
}

function onContentClick(event) {
  const link = event.target?.closest?.('a')
  const path = helpPath(link?.getAttribute('href'))
  if (!path) return
  event.preventDefault()
  router.push(path)
}

const title = computed(() => (serviceId.value ? `Help: ${serviceId.value}` : 'Help and tutorials'))

watch(() => [route.params.slug, route.params.service, route.params.assetPath], load, {
  immediate: true,
})
</script>

<template>
  <div class="help-page">
    <PageHeader :title="title" />

    <nav v-if="state.page.nav.length" class="help-nav" aria-label="Help topics">
      <v-chip
        v-for="link in state.page.nav"
        :key="link.href"
        :to="helpPath(link.href) || link.href"
        :color="link.active ? 'secondary' : undefined"
        :variant="link.active ? 'tonal' : 'outlined'"
        :aria-current="link.active ? 'page' : undefined"
        size="small"
      >
        {{ link.label }}
      </v-chip>
    </nav>

    <v-card class="help-card" rounded="lg" flat>
      <LoadingState v-if="state.loading" text="Loading help…" />
      <ErrorAlert v-else-if="state.error" :error="state.error" title="No help to show" />
      <HelpArticle v-else :html="state.page.html" @click="onContentClick" />
    </v-card>
  </div>
</template>

<style scoped>
.help-page {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-7);
}

.help-nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-2);
  margin-block-end: var(--md-space-4);
}

.help-card {
  padding: var(--md-space-5) var(--md-space-6);
  border: 1px solid var(--md-color-border);
  box-shadow: var(--md-shadow-1);
}
</style>
