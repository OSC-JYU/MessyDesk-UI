<template>
    <v-container>
      <v-btn
        class="ma-2"
        color="primary"
        icon="mdi-close"
        style="position: absolute; top: 0; left: -60px; z-index:1000"
        @click="$emit('change-tab',store.tab)"
      ></v-btn>

      <v-row class="h-100">

        <v-col cols="2" class="pt-8">
          <template v-if="state.file_count > 0">
            <div class="d-flex align-center justify-center">
              <v-btn @click="prev()" :disabled="state.skip == 1" color="secondary"><v-icon>mdi-chevron-left</v-icon></v-btn>
              <span class="mx-3">{{ state.skip }} / {{ state.file_count }}</span>
              <v-btn @click="next()" :disabled="state.skip == state.file_count" color="secondary"><v-icon>mdi-chevron-right</v-icon></v-btn>
            </div>
          </template>

          <div v-if="state.source_label" class="mt-2 mb-3">
            <v-chip color="teal-darken-2" variant="flat">Original: {{ state.source_label }}</v-chip>
          </div>

          <v-switch
            v-if="state.source_rid"
            v-model="state.grouped_boundary_enabled"
            density="compact"
            hide-details
            color="primary"
            label="Grouped boundary nav"
            class="mb-2"
            @update:model-value="onToggleGroupedBoundary"
          ></v-switch>

          <div v-if="state.file" class="mt-4">
            <h5 class="mb-2">{{ state.file.label }}</h5>
            <a class="text-medium-emphasis" title="open file in browser tab" target="_blank" :href="apiUrl + '/api/files/' + state.file['@rid'].replace('#','')">
              <v-btn color="primary">Open full file</v-btn>
            </a>
          </div>
        </v-col>

        <v-col cols="10" fill-height>
          <iframe :src="state.rid" width="100%" height="100%"></iframe>
        </v-col>
      </v-row>
    </v-container>

  </template>
  
  <script setup>

    import { onMounted, onUnmounted, watch, reactive } from "vue";
    import web from "../../web.js";
    import {store} from "../../components/Store.js";
    const apiUrl = import.meta.env.VITE_API_PATH;

    // tab controls
    const emit = defineEmits(['change-tab'])
    const props = defineProps(['tab'])

    function useGroupedBrowse() {
      return Boolean(
        state.grouped_boundary_enabled &&
        store.set_browse_context &&
        store.set_browse_context.mode == 'children' &&
        state.source_rid
      )
    }

    function groupedBaseOptions() {
      return {
        groupByOrigin: true,
        groupBoundary: state.group_boundary || 'pdf',
      }
    }

    async function openPdfFile(file) {
      state.file = file
      state.rid = apiUrl + "/api/files/" + state.file['@rid'].replace('#', '')
      store.file = file
    }

    async function refreshGroupedPosition() {
      if(!useGroupedBrowse()) return
      const response = await web.getSetFiles(state.set_rid, 0, 10000, {...groupedBaseOptions(), sourceRid: state.source_rid})
      const files = response?.files || []
      const currentIndex = files.findIndex((f) => f['@rid'] == state.file?.['@rid'])
      if(currentIndex >= 0) {
        state.skip = currentIndex + 1
        state.file_count = files.length
      } else {
        state.skip = 1
        state.file_count = files.length
      }
    }

    async function load() {
      if(!store.file || !store.file['@rid']) return
      state.set_rid = store.source || store.current_node?.id || null
      state.source_rid = store.set_browse_context?.sourceRid || null
      state.source_label = store.set_browse_context?.sourceLabel || null
      state.group_boundary = store.set_browse_context?.groupBoundary || 'pdf'
      state.grouped_boundary_enabled = Boolean(state.source_rid)

      state.file = await web.getDocInfo(store.file['@rid'])
      state.rid = apiUrl + "/api/files/" + state.file['@rid'].replace('#', '')

      if(useGroupedBrowse()) {
        await refreshGroupedPosition()
      } else {
        state.file_count = store.file_count || null
        if(store.skip >= 0) state.skip = store.skip + 1
        else state.skip = null
      }
    }

    async function refreshFlatPosition() {
      if(!state.set_rid || !state.file?.['@rid']) return
      const response = await web.getSetFiles(state.set_rid, 0, 10000)
      const files = response?.files || []
      const index = files.findIndex((f) => f['@rid'] == state.file['@rid'])
      state.file_count = response?.file_count || files.length
      state.skip = index >= 0 ? index + 1 : 1
    }

    async function onToggleGroupedBoundary() {
      if(useGroupedBrowse()) {
        await refreshGroupedPosition()
      } else {
        await refreshFlatPosition()
      }
    }

    async function prev() {
      if(useGroupedBrowse()) {
        const current = await web.getSetFiles(state.set_rid, 0, 10000, {...groupedBaseOptions(), sourceRid: state.source_rid})
        const currentFiles = current?.files || []
        const currentIndex = currentFiles.findIndex((f) => f['@rid'] == state.file?.['@rid'])

        if(currentIndex > 0) {
          await openPdfFile(currentFiles[currentIndex - 1])
          await refreshGroupedPosition()
          return
        }

        const groupsResponse = await web.getSetFiles(state.set_rid, 0, 10000, groupedBaseOptions())
        const groups = groupsResponse?.groups || []
        const groupIndex = groups.findIndex((g) => g.source_rid == state.source_rid)
        if(groupIndex <= 0) return

        const prevGroup = groups[groupIndex - 1]
        const prevGroupChildrenResponse = await web.getSetFiles(state.set_rid, 0, 10000, {...groupedBaseOptions(), sourceRid: prevGroup.source_rid})
        const prevChildren = prevGroupChildrenResponse?.files || []
        if(!prevChildren.length) return

        state.source_rid = prevGroup.source_rid
        state.source_label = prevGroup.label || state.source_label
        await openPdfFile(prevChildren[prevChildren.length - 1])
        await refreshGroupedPosition()
        return
      }

      if((state.skip - 1) < 1) return
      state.skip = state.skip - 1
      const response = await web.getSetFiles(state.set_rid || store.current_node.id, state.skip - 1, 1)
      if(!response?.files?.[0]) return
      await openPdfFile(response.files[0])
      store.skip = state.skip - 1
    }

    async function next() {
      if(useGroupedBrowse()) {
        const current = await web.getSetFiles(state.set_rid, 0, 10000, {...groupedBaseOptions(), sourceRid: state.source_rid})
        const currentFiles = current?.files || []
        const currentIndex = currentFiles.findIndex((f) => f['@rid'] == state.file?.['@rid'])

        if(currentIndex >= 0 && currentIndex < (currentFiles.length - 1)) {
          await openPdfFile(currentFiles[currentIndex + 1])
          await refreshGroupedPosition()
          return
        }

        const groupsResponse = await web.getSetFiles(state.set_rid, 0, 10000, groupedBaseOptions())
        const groups = groupsResponse?.groups || []
        const groupIndex = groups.findIndex((g) => g.source_rid == state.source_rid)
        if(groupIndex < 0 || groupIndex >= groups.length - 1) return

        const nextGroup = groups[groupIndex + 1]
        const nextGroupChildrenResponse = await web.getSetFiles(state.set_rid, 0, 10000, {...groupedBaseOptions(), sourceRid: nextGroup.source_rid})
        const nextChildren = nextGroupChildrenResponse?.files || []
        if(!nextChildren.length) return

        state.source_rid = nextGroup.source_rid
        state.source_label = nextGroup.label || state.source_label
        await openPdfFile(nextChildren[0])
        await refreshGroupedPosition()
        return
      }

      if((state.skip) >= state.file_count) return
      state.skip = state.skip + 1
      const response = await web.getSetFiles(state.set_rid || store.current_node.id, state.skip - 1, 1)
      if(!response?.files?.[0]) return
      await openPdfFile(response.files[0])
      store.skip = state.skip - 1
    }

    function handleKeyUp(event) {
      if(event.key == 'ArrowLeft') prev()
      if(event.key == 'ArrowRight') next()
    }

    // tab change launces content update. Could be done otherwise propably?
    watch(() => props.tab, async (newValue, oldValue) => {
      await load()
    })

    var state = reactive({
        file: null,
        cruncher: null,
        rid: null,
        skip: null,
      file_count: null,
      set_rid: null,
      source_rid: null,
      source_label: null,
      grouped_boundary_enabled: true,
      group_boundary: 'pdf',
    })

    onMounted(async()=> {
        window.addEventListener("keyup", handleKeyUp)
        await load()
    })

    onUnmounted(() => {
      window.removeEventListener("keyup", handleKeyUp)
    })

  </script>
  
  <style scoped>
  .container {
    display: flex;
  }
  
  .column {
    flex: 1;
  }
  
  .column img {
    max-width: 100%;
    height: auto;
  }

  .v-container {
  max-width: 1600px;
  margin-left:100px;
}
  </style>