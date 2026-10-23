<script setup>
import { computed, reactive, toRef, watch } from 'vue'
import { session } from '@/stores/session.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import EmptyState from '@/ui/EmptyState.vue'
import AddTagDialog from './AddTagDialog.vue'
import TagActionDialog from './TagActionDialog.vue'
import TagImportDialog from './TagImportDialog.vue'
import TagTypesDialog from './TagTypesDialog.vue'
import { showCreators } from './tagAdmin.js'
import { ADMIN_PAGE_SIZE, useTagAction, useTagAdmin } from './useTagAdmin.js'

// Manage the human tags of a desk (or, without `deskRid`, of all desks): create, rename, import
// from another desk, remove from this desk and, in the global view, delete everywhere.
const open = defineModel({ type: Boolean, default: false })
const props = defineProps({ deskRid: { type: String, default: '' } })
const emit = defineEmits(['changed'])

const deskRid = toRef(props, 'deskRid')
const admin = useTagAdmin(deskRid)
const { state } = admin
const dialogs = reactive({ add: false, import: false, types: false })

async function changed() {
  await admin.load()
  emit('changed')
}
const action = useTagAction(deskRid, changed)

const pages = computed(() => Math.max(1, Math.ceil(state.total / ADMIN_PAGE_SIZE)))
const withCreators = computed(() => showCreators(state.items, session.user?.rid))

watch(open, (isOpen) => isOpen && admin.load(), { immediate: true })
</script>

<template>
  <v-dialog v-model="open" max-width="960" scrollable>
    <v-card rounded="lg">
      <v-toolbar color="surface" density="comfortable" class="border-b">
        <v-toolbar-title>
          {{ deskRid ? 'Tag admin' : 'Tag admin (all desks)' }}
        </v-toolbar-title>
        <v-btn icon="mdi-close" aria-label="Close" @click="open = false" />
      </v-toolbar>
      <v-card-text>
        <div class="tag-admin__bar">
          <v-text-field
            v-model="state.search"
            label="Search tags"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            clearable
            hide-details
            class="tag-admin__search"
          />
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-plus"
            data-test="admin-new"
            @click="dialogs.add = true"
          >
            New tag
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-shape-outline"
            data-test="admin-types"
            @click="dialogs.types = true"
          >
            Tag types
          </v-btn>
          <v-btn
            v-if="deskRid"
            variant="tonal"
            prepend-icon="mdi-tag-arrow-down-outline"
            data-test="admin-import"
            @click="dialogs.import = true"
          >
            Import from another desk
          </v-btn>
        </div>

        <ErrorAlert
          :error="state.error"
          title="Could not load tags"
          retryable
          @retry="admin.load"
        />
        <v-progress-linear v-if="state.loading" indeterminate class="mb-2" />
        <EmptyState
          v-if="!state.loading && !state.error && !state.items.length"
          icon="mdi-tag-outline"
          :title="state.search ? 'No tags match' : 'No tags yet'"
        />
        <v-table v-else-if="state.items.length" density="comfortable" class="tag-admin__table">
          <thead>
            <tr>
              <th>Tag</th>
              <th>Type</th>
              <th class="text-end">Files</th>
              <th>Desks</th>
              <th v-if="withCreators">Created by</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tag in state.items" :key="tag.rid" data-test="admin-row">
              <td>{{ tag.label }}</td>
              <td>{{ tag.type }}</td>
              <td class="text-end">{{ tag.files }}</td>
              <td>
                <v-chip
                  v-for="desk in tag.desks"
                  :key="desk.rid"
                  size="x-small"
                  label
                  variant="tonal"
                  class="me-1"
                >
                  {{ desk.label }}
                </v-chip>
              </td>
              <td v-if="withCreators">{{ tag.creator?.name || '' }}</td>
              <td class="text-end tag-admin__actions">
                <v-btn
                  icon="mdi-pencil-outline"
                  size="small"
                  variant="text"
                  :aria-label="`Rename ${tag.label}`"
                  data-test="admin-rename"
                  @click="action.begin('rename', tag)"
                />
                <v-btn
                  v-if="deskRid"
                  icon="mdi-tag-off-outline"
                  size="small"
                  variant="text"
                  :aria-label="`Remove ${tag.label} from this desk`"
                  data-test="admin-remove"
                  @click="action.begin('remove', tag)"
                />
                <v-btn
                  v-else
                  icon="mdi-delete-outline"
                  size="small"
                  variant="text"
                  color="error"
                  :aria-label="`Delete ${tag.label} everywhere`"
                  data-test="admin-delete"
                  @click="action.begin('delete', tag)"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
        <v-pagination
          v-if="pages > 1"
          v-model="state.page"
          :length="pages"
          density="comfortable"
          class="mt-3"
        />
      </v-card-text>
    </v-card>
  </v-dialog>

  <AddTagDialog v-model="dialogs.add" :desk-rid="deskRid" @created="changed" />
  <TagImportDialog
    v-if="deskRid"
    v-model="dialogs.import"
    :desk-rid="deskRid"
    @imported="changed"
  />
  <TagTypesDialog v-model="dialogs.types" @changed="changed" />
  <TagActionDialog :action="action" :desk-rid="deskRid" />
</template>

<style scoped>
.tag-admin__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--md-space-2);
  margin-block-end: var(--md-space-4);
}

.tag-admin__search {
  flex: 1 1 var(--md-card-min-width);
}

.tag-admin__actions {
  white-space: nowrap;
}
</style>
