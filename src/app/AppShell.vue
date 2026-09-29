<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'

const route = useRoute()
const legacy = computed(() => route.matched.some((r) => r.meta.legacy))
</script>

<template>
  <AppHeader />
  <v-main class="app-main" :class="{ 'legacy-screen': legacy }">
    <slot />
  </v-main>
</template>

<style scoped>
/* Screens fill exactly the space under the header and scroll inside it. */
.app-main {
  height: 100dvh;
  overflow-y: auto;
}
</style>
