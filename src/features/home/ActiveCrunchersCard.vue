<script setup>
import { computed, onMounted, reactive } from 'vue'
import { getServices } from '@/api/services.js'
import SectionCard from '@/ui/SectionCard.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'

// Processing services (crunchers) that have workers running.
const state = reactive({ services: [], loading: true, error: null })

const active = computed(() =>
  state.services
    .map((service) => ({
      id: service.id,
      name: service.name || service.id,
      description: service.description || 'Working in the background',
      workers: Array.isArray(service.consumers) ? service.consumers.length : 0,
      active: service.active === true,
    }))
    .filter((service) => service.workers > 0 || service.active)
    .sort((a, b) => b.workers - a.workers),
)

onMounted(async () => {
  try {
    const services = await getServices()
    state.services = Object.entries(services || {}).map(([id, service]) => ({ id, ...service }))
  } catch (error) {
    state.error = error
  } finally {
    state.loading = false
  }
})
</script>

<template>
  <SectionCard overline="Live" title="Active crunchers">
    <v-skeleton-loader v-if="state.loading" type="list-item-two-line" />
    <ErrorAlert v-else-if="state.error" :error="state.error" title="Could not load crunchers" />
    <v-list v-else-if="active.length" lines="two" density="compact" class="crunchers__list">
      <v-list-item v-for="service in active" :key="service.id" class="px-0">
        <v-list-item-title>{{ service.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ service.description }}</v-list-item-subtitle>
        <template #append>
          <v-chip color="primary" size="small" variant="tonal" label>
            {{ service.workers || 1 }} running
          </v-chip>
        </template>
      </v-list-item>
    </v-list>
    <p v-else class="crunchers__empty">No crunchers running right now.</p>
  </SectionCard>
</template>

<style scoped>
.crunchers__list {
  background: transparent;
}

.crunchers__empty {
  margin: 0;
  color: var(--md-color-text-muted);
}
</style>
