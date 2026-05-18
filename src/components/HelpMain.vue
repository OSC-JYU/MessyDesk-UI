<script setup>
import { onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import JYUHeader_plain from './JYUHeader_plain.vue'
import web from '../web.js'

const route = useRoute()
const router = useRouter()

document.title = 'MessyDesk - Help'

const state = reactive({
  loading: true,
  error: '',
  html: ''
})

function withApiBase(pathname) {
  const base = String(import.meta.env.VITE_API_PATH || '').replace(/\/$/, '')
  return `${base}${pathname}`
}

function resolveHelpAssetUrls(html) {
  if (!html) return html
  return html.replace(/(["'])\/api\/help\/images\/([^"']+)\1/g, (match, quote, assetPath) => {
    const decodedAssetPath = assetPath.replace(/^\/+/, '')
    return `${quote}${withApiBase(`/api/help/images/${decodedAssetPath}`)}${quote}`
  })
}

function normalizeSlug(rawSlug) {
  if (!rawSlug) return 'index'
  const slug = String(rawSlug).trim().toLowerCase()
  if (!slug || slug === 'index') return 'index'
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  return slug
}

async function loadHelp() {
  state.loading = true
  state.error = ''

  const slug = normalizeSlug(route.params.slug)
  if (!slug) {
    state.loading = false
    state.error = 'Invalid help page address.'
    return
  }

  try {
    const rawHtml = await web.getHelp(slug)
    state.html = resolveHelpAssetUrls(rawHtml)
  } catch (error) {
    if (error?.status === 404) {
      state.error = 'Help page not found.'
    } else {
      state.error = error?.message || 'Failed to load help page.'
    }
    state.html = ''
  } finally {
    state.loading = false
  }
}

function onHelpContentClick(event) {
  const link = event.target?.closest?.('a')
  if (!link) return

  const href = link.getAttribute('href')
  if (!href) return

  if (href === '/help' || href.startsWith('/help/')) {
    event.preventDefault()
    router.push(href)
  }
}

onMounted(loadHelp)
watch(() => route.params.slug, loadHelp)
</script>

<template>
  <div class="help-page">
    <JYUHeader_plain />

    <v-container class="py-6">
      <v-card class="help-card">
        <v-card-title class="help-title">Help And Tutorials</v-card-title>
        <v-card-text>
          <div v-if="state.loading" class="help-loading">
            <v-progress-circular indeterminate color="teal-darken-2" />
          </div>

          <v-alert v-else-if="state.error" type="warning" variant="tonal">
            {{ state.error }}
          </v-alert>

          <div
            v-else
            class="help-content"
            @click="onHelpContentClick"
            v-html="state.html"
          ></div>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
.help-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #edf4f7 0%, #f9fcfd 100%);
  padding-top: 72px;
}

.help-card {
  border-radius: 14px;
  border: 1px solid #d6e4e8;
  overflow: hidden;
}

.help-title {
  background: linear-gradient(135deg, #0f5d61 0%, #19878d 100%);
  color: #f2fbfc;
  font-weight: 600;
}

.help-loading {
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-content {
  font-family: "Segoe UI", "Noto Sans", sans-serif;
}

.help-content :deep(main.page) {
  max-width: 100%;
  margin: 0;
  padding: 0;
}

.help-content :deep(nav.help-nav) {
  margin-bottom: 14px;
}

.help-content :deep(article.content) {
  box-shadow: none;
}
</style>
