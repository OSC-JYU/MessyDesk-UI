<template>
  <div class="tag-tools">
    <!-- Current entity tags on file -->
    <div v-if="file && file.entities && file.entities.length" class="mb-2">
      <v-chip 
        v-for="entity of file.entities" 
        :key="entity.rid" 
        :color="entity.color" 
        variant="outlined"
        class="ma-1"
        size="x-small"
        @click="deleteOrOpenEntity($event, entity.rid)"
      >
        <v-icon :icon="'mdi-' + entity.icon.toLowerCase()" start size="x-small"></v-icon>
        {{ entity.label }}
        <v-icon v-if="isCtrlPressed" icon="mdi-close-circle" end size="x-small"></v-icon>
      </v-chip>
      <p class="text-caption mt-1">Ctrl + click to remove</p>
    </div>

    <!-- Available tags to add -->
    <v-list v-model:opened="openGroups" density="compact">
      <v-list-group value="Available Tags">
        <template v-slot:activator="{ props: listProps }">
          <v-list-item v-bind="listProps" title="Available Tags" prepend-icon="mdi-tag-multiple" class="text-caption"></v-list-item>
        </template>

        <v-list-group v-for="type in entities" :key="type.type">
          <template v-slot:activator="{ props: listProps }">
            <v-list-item v-bind="listProps" :title="type.type" :prepend-icon="'mdi-' + type.icon" class="text-caption"></v-list-item>
          </template>
          <v-chip 
            v-for="item in type.items" 
            :key="item['@rid']" 
            :color="item.color"
            class="ma-1"
            size="x-small"
            @click="linkEntity(item['@rid'])"
          >
            <v-icon :icon="'mdi-' + item.icon.toLowerCase()" start size="x-small"></v-icon>
            {{ item.label }}
          </v-chip>
        </v-list-group>
      </v-list-group>
    </v-list>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import web from '../../web.js'

const props = defineProps({
  file: { type: Object, default: null },
  entities: { type: [Array, Object], default: () => ({}) }
})

const emit = defineEmits(['file-updated'])

const openGroups = ref([])
const isCtrlPressed = ref(false)

function handleKeyDown(event) {
  if (event.ctrlKey) isCtrlPressed.value = true
}
function handleKeyUp() {
  isCtrlPressed.value = false
}

async function linkEntity(entityID) {
  if (!props.file) return
  await web.linkEntityToItem(entityID, props.file['@rid'])
  const updated = await web.getDocInfo(props.file['@rid'])
  emit('file-updated', updated)
}

async function unLinkEntity(entityID) {
  if (!props.file) return
  await web.unLinkEntity(entityID, props.file['@rid'])
  const updated = await web.getDocInfo(props.file['@rid'])
  emit('file-updated', updated)
}

async function deleteOrOpenEntity(event, entityID) {
  if (isCtrlPressed.value) {
    await unLinkEntity(entityID)
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>
