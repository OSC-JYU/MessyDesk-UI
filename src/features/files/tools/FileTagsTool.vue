<script setup>
import { onMounted, ref } from 'vue'
import { getEntities, linkEntityToItem, unLinkEntity } from '@/api/entities.js'
import { getDocInfo } from '@/api/files.js'

// Tags on the file (remove with the chip's close button) and the tags that
// can be added, by type.
const props = defineProps({ file: { type: Object, required: true } })
const emit = defineEmits(['file-updated'])

const types = ref([])
const busy = ref(false)

const icon = (name) => (name ? `mdi-${String(name).toLowerCase()}` : undefined)
const onFile = (rid) => (props.file.entities || []).some((e) => (e.rid || e['@rid']) === rid)

async function change(action, entityRid) {
  busy.value = true
  try {
    await action(entityRid, props.file['@rid'])
    emit('file-updated', await getDocInfo(props.file['@rid']))
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  types.value = (await getEntities().catch(() => [])) || []
})
</script>

<template>
  <div class="file-tags">
    <div v-if="file.entities?.length" class="file-tags__current">
      <v-chip
        v-for="entity in file.entities"
        :key="entity.rid"
        :color="entity.color"
        :prepend-icon="icon(entity.icon)"
        size="small"
        closable
        :close-label="`Remove tag ${entity.label}`"
        :disabled="busy"
        @click:close="change(unLinkEntity, entity.rid)"
      >
        {{ entity.label }}
      </v-chip>
    </div>
    <p v-else class="file-tags__muted">No tags yet.</p>

    <v-expansion-panels variant="accordion" class="file-tags__available">
      <v-expansion-panel v-for="type in types" :key="type.type">
        <v-expansion-panel-title>
          <v-icon :icon="icon(type.icon)" size="16" class="me-2" aria-hidden="true" />
          {{ type.type }}
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="file-tags__current">
            <v-chip
              v-for="item in type.items"
              :key="item['@rid']"
              :color="item.color"
              :prepend-icon="icon(item.icon)"
              size="small"
              variant="tonal"
              :disabled="busy || onFile(item['@rid'])"
              @click="change(linkEntityToItem, item['@rid'])"
            >
              {{ item.label }}
            </v-chip>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped>
.file-tags__current {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-1);
}

.file-tags__muted {
  margin: 0;
  color: var(--md-color-text-muted);
  font-size: var(--md-font-size-xs);
}

.file-tags__available {
  margin-block-start: var(--md-space-3);
}
</style>
