<script setup>
import AppHeader from './AppHeader.vue'
</script>

<template>
  <AppHeader />
  <v-main class="app-main">
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
