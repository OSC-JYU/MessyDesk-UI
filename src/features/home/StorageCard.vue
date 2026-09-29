<script setup>
import { computed } from 'vue'
import SectionCard from '@/ui/SectionCard.vue'

const props = defineProps({
  storage: { type: Object, default: null },
})

const colour = computed(() => {
  const used = props.storage?.used_percent || 0
  if (used > 90) return 'error'
  if (used > 70) return 'warning'
  return 'primary'
})
</script>

<template>
  <SectionCard overline="Your storage" title="Disk usage">
    <template v-if="storage">
      <div class="storage__numbers">
        <span>{{ (storage.used_mb / 1024).toFixed(2) }} GB used</span>
        <span class="storage__quota">{{ storage.quota_gb }} GB quota</span>
      </div>
      <v-progress-linear
        :model-value="storage.used_percent"
        :color="colour"
        bg-color="surface-variant"
        rounded
        height="8"
        :aria-label="`${storage.used_percent}% of storage used`"
      />
      <p class="storage__percent">{{ storage.used_percent }}% used</p>
    </template>
    <p v-else class="storage__empty">No size data yet. Use Refresh on the desk list.</p>
  </SectionCard>
</template>

<style scoped>
.storage__numbers {
  display: flex;
  justify-content: space-between;
  margin-block-end: var(--md-space-2);
}

.storage__quota,
.storage__percent,
.storage__empty {
  color: var(--md-color-text-muted);
}

.storage__percent {
  margin: var(--md-space-2) 0 0;
  font-size: var(--md-font-size-xs);
}

.storage__empty {
  margin: 0;
}
</style>
