<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { getEntities, getEntitiesByType, linkEntityToItem, unLinkEntity } from '@/api/entities.js'
import { getDocInfo } from '@/api/files.js'
import { taggedByText } from '@/features/tags/tagGroups.js'

// Tags on the file (remove with the chip's close button) and the tags that
// can be added, by type. The applied tags come last, so the tag lists above
// keep their place while tagging. Only the desk's own tags are offered (they are created
// in Tag admin); outside a desk all of the user's tags are listed.
const props = defineProps({
  file: { type: Object, required: true },
  deskRid: { type: String, default: '' },
})
const emit = defineEmits(['file-updated'])

// Tag types with counts; a type's tags are loaded when its panel opens. Panels
// stay open until the user closes them.
const types = ref([])
const openTypes = ref([])
const items = reactive({})
const busy = ref(false)

const scope = () => ({ projectRid: props.deskRid, createdBy: 'user' })

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

async function loadType(type, more = false) {
  const current = items[type]
  if (current?.loading || (current && !more)) return
  const skip = more && current ? current.items.length : 0
  items[type] = { items: current?.items || [], total: current?.total ?? 0, loading: true }
  const page = await getEntitiesByType(type, { ...scope(), skip }).catch(() => null)
  items[type] = {
    items: [...(skip ? current.items : []), ...(page?.items || [])],
    total: page?.total ?? 0,
    loading: false,
  }
}

async function loadTypes() {
  types.value = (await getEntities(scope()).catch(() => [])) || []
  Object.keys(items).forEach((type) => delete items[type])
  openTypes.value.forEach((type) => loadType(type))
}

watch(openTypes, (open) => (open || []).forEach((type) => loadType(type)))
watch(() => props.deskRid, loadTypes)
onMounted(loadTypes)
</script>

<template>
  <div class="file-tags">
    <v-expansion-panels v-model="openTypes" multiple variant="accordion" class="file-tags__available">
      <v-expansion-panel v-for="type in types" :key="type.type" :value="type.type">
        <v-expansion-panel-title>
          <v-icon :icon="icon(type.icon)" size="16" class="me-2" aria-hidden="true" />
          {{ type.type }} ({{ type.count }})
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <div class="file-tags__current">
            <v-chip
              v-for="item in items[type.type]?.items || []"
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
          <v-progress-linear v-if="items[type.type]?.loading" indeterminate class="mt-2" />
          <v-btn
            v-else-if="(items[type.type]?.items.length || 0) < (items[type.type]?.total || 0)"
            size="small"
            variant="text"
            class="mt-2"
            @click="loadType(type.type, true)"
          >
            Show more
          </v-btn>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <div v-if="file.entities?.length" class="file-tags__current file-tags__applied">
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
        <v-tooltip v-if="taggedByText(entity)" activator="parent" location="top">
          {{ taggedByText(entity) }}
        </v-tooltip>
        {{ entity.label }}
      </v-chip>
    </div>
    <p v-else class="file-tags__muted file-tags__applied">No tags yet.</p>
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

.file-tags__applied {
  margin-block-start: var(--md-space-3);
}
</style>
