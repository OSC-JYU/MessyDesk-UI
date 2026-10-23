<script setup>
import { reactive } from 'vue'

// Service groups decide which services a user sees, and may limit the tokens
// their members use on paid LLM providers. Fields save when they lose focus.
const props = defineProps({
  groups: { type: Array, required: true },
  usage: { type: Object, default: () => ({}) },
  uploadLogo: { type: Function, required: true },
})
const emit = defineEmits(['save', 'delete', 'add'])

const LIMITS = [
  { key: 'per_user', label: 'Per user' },
  { key: 'group_total', label: 'Whole group' },
  { key: 'per_job_max_output', label: 'Answer per job' },
]

const uploading = reactive({})

function formatTokens(value) {
  return value === null || value === undefined ? '–' : Number(value).toLocaleString()
}
const inputs = {}

const headers = [
  { title: 'Logo', key: 'logo', sortable: false },
  { title: 'Id', key: 'id' },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Token limits per month', key: 'limits', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]

function logoUrl(group) {
  if (!group.logo) return null
  const base = String(import.meta.env.VITE_API_PATH || '').replace(/\/$/, '')
  return `${base}/api/service-groups/${encodeURIComponent(group.id)}/logo?v=${group.logo_version || 0}`
}

async function onFile(group, event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading[group.id] = true
  try {
    await props.uploadLogo(group, file)
  } finally {
    uploading[group.id] = false
    event.target.value = ''
  }
}
</script>

<template>
  <div class="groups-tab__toolbar">
    <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-plus" @click="emit('add')">
      Add service group
    </v-btn>
  </div>
  <v-data-table :items="groups" :headers="headers" density="comfortable" item-value="id">
    <template #[`item.logo`]="{ item }">
      <div class="groups-tab__logo">
        <v-avatar size="40" rounded="md" color="surface-variant">
          <v-img
            v-if="logoUrl(item)"
            :src="logoUrl(item)"
            :alt="`${item.name || item.id} logo`"
            cover
          />
          <v-icon v-else icon="mdi-image-off-outline" aria-hidden="true" />
        </v-avatar>
        <v-btn
          size="x-small"
          variant="text"
          :loading="uploading[item.id]"
          @click="inputs[item.id].click()"
        >
          Upload
        </v-btn>
        <input
          :ref="(el) => (inputs[item.id] = el)"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          @change="onFile(item, $event)"
        />
      </div>
    </template>
    <template #[`item.id`]="{ item }"
      ><code>{{ item.id }}</code></template
    >
    <template #[`item.name`]="{ item }">
      <v-text-field
        v-model="item.name"
        :aria-label="`Name of ${item.id}`"
        density="compact"
        variant="underlined"
        hide-details
        @blur="emit('save', item)"
      />
    </template>
    <template #[`item.description`]="{ item }">
      <v-text-field
        v-model="item.description"
        :aria-label="`Description of ${item.id}`"
        density="compact"
        variant="underlined"
        hide-details
        @blur="emit('save', item)"
      />
    </template>
    <template #[`item.limits`]="{ item }">
      <div class="groups-tab__limits">
        <v-text-field
          v-for="limit in LIMITS"
          :key="limit.key"
          v-model="item.token_limits[limit.key]"
          :label="limit.label"
          :aria-label="`${limit.label} token limit of ${item.id}`"
          type="number"
          min="1"
          placeholder="no limit"
          persistent-placeholder
          density="compact"
          variant="underlined"
          hide-details
          @blur="emit('save', item)"
        />
      </div>
      <span class="groups-tab__used">Used this month: {{ formatTokens(usage[item.id]) }}</span>
    </template>
    <template #[`item.actions`]="{ item }">
      <v-btn
        color="error"
        size="small"
        variant="text"
        icon="mdi-delete-outline"
        :aria-label="`Delete ${item.id}`"
        @click="emit('delete', item)"
      />
    </template>
  </v-data-table>
</template>

<style scoped>
.groups-tab__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-block-end: var(--md-space-3);
}

.groups-tab__limits {
  display: grid;
  grid-template-columns: repeat(3, minmax(6rem, 1fr));
  gap: var(--md-space-2);
}

.groups-tab__used {
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.groups-tab__logo {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
}
</style>
