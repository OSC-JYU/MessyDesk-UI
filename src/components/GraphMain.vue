
<style>

.full-background {
    background-image:  linear-gradient(rgba(19,84,122,.8), rgba(128,208,199,.8)),url('../assets/images/right-column-bg2.png');
    background-size: cover; /* Ensures the image covers the entire div */
    background-repeat: no-repeat; /* Prevents the image from repeating */
    background-position: center; /* Centers the image within the div */
    width: 100%; /* Optional: make the div take up the full width of its container */
    height: 100%; /* Optional: make the div take up the full height of its container */

}

</style>

<script setup>
    import { reactive, computed } from "vue";
    import { useRoute, useRouter } from 'vue-router'
    import web from "../web.js";
    import {store} from "./Store.js";
    import NodeDeleter from './NodeDeleter.vue'
    import Uploader from './Uploader.vue'
    import NodeCard from './NodeCard.vue'
    import JYUHeader from './JYUHeader.vue'
    import CruncherList from './CruncherList.vue'

    import SetCreator from './SetCreator.vue'
    import SourceCreator from './SourceCreator.vue'

    import CookieIcon from '@/assets/images/cookie-bite-solid_blue.svg';

    document.title = "MessyDesk"

    const route  = useRoute();
    const router = useRouter();

    var state = reactive({node:''})

    // Derive active view from route name for header tab highlighting
    const activeView = computed(() => {
      const name = route.name
      if (name === 'project-search') return 'search'
      if (name === 'project-entities') return 'entities'
      if (name === 'project-file') return 'file'
      return 'graph'
    })

    // Project RID from route
    const projectRid = computed(() => route.params.rid || null)

    function fitToNode(id) {
        state.node = id + '-' + Math.random()
    }

    function changeView(view) {
      if (!projectRid.value) return
      const rid = projectRid.value
      if (view === 'graph' || view === 0) {
        router.push({ name: 'project-graph', params: { rid } })
      } else if (view === 'search' || view === 1) {
        router.push({ name: 'project-search', params: { rid } })
      } else if (view === 'entities' || view === 2) {
        router.push({ name: 'project-entities', params: { rid } })
      }
    }

    async function openNode(node_rid, source_rid, total_count, skip, browseContext) {
      var response = await web.getDocInfo(node_rid)
      store.file = response
      store.source = source_rid
      store.file_count = total_count
      store.skip = skip
      store.set_browse_context = browseContext || null

      // Build unified file_browse_context for the new wrapper
      if (browseContext || source_rid) {
        store.file_browse_context = {
          mode: 'set',
          set_rid: source_rid || store.current_node?.id || null,
          set_label: browseContext?.setLabel || null,
          file_count: total_count || 0,
          skip: skip || 0,
          group_boundary: browseContext?.groupBoundary || 'pdf',
          source_rid: browseContext?.sourceRid || null,
          source_label: browseContext?.sourceLabel || null,
          grouped_boundary_enabled: Boolean(browseContext?.sourceRid)
        }
      } else {
        store.file_browse_context = null
      }

      // Navigate to file route
      const fileRid = node_rid.replace('#', '')
      router.push({ name: 'project-file', params: { rid: projectRid.value, fileRid } })
    }

    function goBackToGraph() {
      if (projectRid.value) {
        router.push({ name: 'project-graph', params: { rid: projectRid.value } })
      }
    }

    // Pass relevant props to child route components
    function childRouteProps(childRoute) {
      if (childRoute.name === 'project-graph') {
        return { mode: 'graph', fit: state.node, onOpenNode: openNode }
      }
      if (childRoute.name === 'project-search') {
        return { projectRid: projectRid.value }
      }
      if (childRoute.name === 'project-entities') {
        return { onOpenNode: openNode, projectRid: projectRid.value }
      }
      if (childRoute.name === 'project-file') {
        return { projectRid: projectRid.value }
      }
      return {}
    }

    // Keep file view component instance stable while fileRid changes to avoid remount races.
    function childRouteKey(childRoute) {
      if (childRoute.name === 'project-file') return 'project-file'
      if (childRoute.name === 'project-search') return 'project-search'
      if (childRoute.name === 'project-entities') return 'project-entities'
      return childRoute.fullPath
    }

</script>


<template>
    
    <v-layout class="fill-height">

        <JYUHeader mode="graph" :activeView="activeView" :projectRid="projectRid" @fit-to-node="fitToNode" @change-view="changeView"/>
        <v-main class="fill-height">

          <!-- Graph view: wrap with sidepanel layout -->
          <template v-if="activeView === 'graph'">
            <v-row class="w-100 fill-height m-0 p-0">
              <v-col class="p-0 m-0 fill-height" cols="9" color="light-blue lighten-3">
                <router-view v-slot="{ Component, route: childRoute }">
                  <keep-alive :include="['GraphDisplay']">
                    <component
                      :is="Component"
                      :key="'graph'"
                      v-bind="childRouteProps(childRoute)"
                    />
                  </keep-alive>
                </router-view>
                <Uploader mode="graph" />
                <NodeDeleter mode="graph" />
                <SetCreator mode="graph" />
                <SourceCreator mode="graph" />
              </v-col>
              <v-col class="p-0 m-0 full-background" cols="3" color="light-blue lighten-1">
                <div class="h-100 w-100 position-absolute">
                  <NodeCard />
                </div>
              </v-col>
            </v-row>
          </template>

          <!-- Non-graph views: full width -->
          <template v-else>
            <router-view v-slot="{ Component, route: childRoute }">
              <keep-alive :include="['GraphDisplay']">
                <component
                  :is="Component"
                  :key="childRouteKey(childRoute)"
                  v-bind="childRouteProps(childRoute)"
                />
              </keep-alive>
            </router-view>
          </template>

          <!-- CRUNCHERS dialog-->
            <v-dialog v-model="store.crunchers_open" width="auto" min-width="900" max-width="900">

              <v-card>
                  <v-toolbar>
                  <v-btn
                      icon="mdi-close"
                      @click="store.crunchers_open = false"
                  ></v-btn>
                  <v-toolbar-title>Available crunchers for {{ store.current_node.type }} {{ store.cruncher_filter }}</v-toolbar-title>


                  <v-spacer></v-spacer>


                  </v-toolbar>

                  <CruncherList />
              </v-card>

              </v-dialog>

        </v-main>
    </v-layout>
</template>