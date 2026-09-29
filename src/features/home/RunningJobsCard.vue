<script setup>
import { computed } from 'vue'
import { batchStore } from '@/stores/batchStore.js'
import SectionCard from '@/ui/SectionCard.vue'
import StatusChip from '@/ui/StatusChip.vue'

// Batch jobs that are still going, fed live by the SSE connection.
const jobs = computed(() =>
  Object.entries(batchStore.jobs)
    .map(([rid, job]) => ({ rid, ...job }))
    .filter((job) => ['running', 'paused', 'cancelling'].includes(job.status)),
)
</script>

<template>
  <SectionCard overline="Live" title="Running jobs">
    <v-list v-if="jobs.length" lines="two" class="jobs__list" density="compact">
      <v-list-item v-for="job in jobs" :key="job.rid" class="px-0">
        <v-list-item-title class="jobs__rid">{{ job.rid }}</v-list-item-title>
        <v-list-item-subtitle>{{ job.message }}</v-list-item-subtitle>
        <template #append>
          <StatusChip :status="job.status" />
        </template>
      </v-list-item>
    </v-list>
    <p v-else class="jobs__empty">No jobs running right now.</p>
  </SectionCard>
</template>

<style scoped>
.jobs__list {
  background: transparent;
}

.jobs__rid {
  font-family: var(--md-font-mono);
}

.jobs__empty {
  margin: 0;
  color: var(--md-color-text-muted);
}
</style>
