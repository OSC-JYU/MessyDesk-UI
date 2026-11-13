<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createDemo,
  deleteDemo,
  demoBundleUrl,
  getAdminDemos,
  reexportDemo,
  updateDemo,
  uploadDemoBundle,
  uploadDemoCover,
} from '@/api/demos.js'
import { getServiceGroups } from '@/api/admin.js'
import { getProjects } from '@/api/projects.js'
import { formatSize, pickText } from '@/features/home/demos.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'
import FormDialog from '@/ui/FormDialog.vue'
import DemoFormDialog from './DemoFormDialog.vue'

// Demo desks ("Learn MessyDesk"): made from a desk or from a bundle zip, shared with everyone,
// service groups or single users. Users get a copy when they open one.
const state = reactive({
  demos: [],
  groups: [],
  desks: [],
  error: null,
  uploading: false,
  form: { open: false, demo: null, pending: false, error: null },
  reexport: { open: false, demo: null, project: '', pending: false, error: null },
  remove: { open: false, demo: null, pending: false, error: '' },
})
const bundleInput = ref(null)
const coverInput = ref(null)
let coverTarget = null

const headers = [
  { title: 'Title', key: 'title', sortable: false },
  { title: 'Version', key: 'version' },
  { title: 'Size', key: 'size' },
  { title: 'Shared with', key: 'sharing', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' },
]
const rows = computed(() =>
  state.demos.map((demo) => ({ ...demo, name: pickText(demo.title, 'en') })),
)

async function guard(action) {
  try {
    state.error = null
    await action()
  } catch (error) {
    state.error = error
  }
}

async function load() {
  await guard(async () => {
    const [demos, groups, desks] = await Promise.all([
      getAdminDemos(),
      getServiceGroups(),
      getProjects(),
    ])
    Object.assign(state, { demos, groups: groups.map((g) => g.id), desks })
  })
}

function sharing(demo) {
  const all = [...demo.service_groups, ...demo.users]
  return all.length ? all.join(', ') : 'Everyone'
}

function openForm(demo = null) {
  Object.assign(state.form, { open: true, demo, pending: false, error: null })
}

async function submitForm(data) {
  state.form.pending = true
  state.form.error = null
  try {
    if (state.form.demo) await updateDemo(state.form.demo.id, data)
    else await createDemo(data)
    state.form.open = false
    await load()
  } catch (error) {
    state.form.error = error
  } finally {
    state.form.pending = false
  }
}

function openReexport(demo) {
  Object.assign(state.reexport, { open: true, demo, project: '', pending: false, error: null })
}

async function submitReexport() {
  if (!state.reexport.project) {
    state.reexport.error = 'Choose the desk to export.'
    return
  }
  state.reexport.pending = true
  state.reexport.error = null
  try {
    await reexportDemo(state.reexport.demo.id, state.reexport.project)
    state.reexport.open = false
    await load()
  } catch (error) {
    state.reexport.error = error
  } finally {
    state.reexport.pending = false
  }
}

function openDelete(demo) {
  Object.assign(state.remove, { open: true, demo, pending: false, error: '' })
}

async function confirmDelete() {
  state.remove.pending = true
  try {
    await deleteDemo(state.remove.demo.id)
    state.remove.open = false
    await load()
  } catch (error) {
    state.remove.error = error?.message || 'Could not delete the demo'
  } finally {
    state.remove.pending = false
  }
}

async function onBundle(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  state.uploading = true
  await guard(async () => {
    await uploadDemoBundle(file)
    await load()
  })
  state.uploading = false
}

function pickCover(demo) {
  coverTarget = demo
  coverInput.value.click()
}

async function onCover(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !coverTarget) return
  await guard(async () => {
    await uploadDemoCover(coverTarget.id, file)
    await load()
  })
}

onMounted(load)
</script>

<template>
  <div class="demos-tab__toolbar">
    <v-btn color="primary" variant="flat" size="small" prepend-icon="mdi-plus" @click="openForm()">
      Create from a desk
    </v-btn>
    <v-btn
      variant="outlined"
      size="small"
      prepend-icon="mdi-upload"
      :loading="state.uploading"
      @click="bundleInput.click()"
    >
      Upload bundle
    </v-btn>
    <input ref="bundleInput" type="file" accept=".zip,application/zip" hidden @change="onBundle" />
    <input
      ref="coverInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      hidden
      @change="onCover"
    />
  </div>
  <ErrorAlert
    :error="state.error"
    title="Demo action failed"
    retryable
    class="mb-3"
    @retry="load"
  />
  <v-data-table :items="rows" :headers="headers" density="comfortable" item-value="id">
    <template #[`item.title`]="{ item }">
      <strong>{{ item.name }}</strong>
      <div class="demos-tab__note">{{ item.files }} {{ item.files === 1 ? 'file' : 'files' }}</div>
    </template>
    <template #[`item.size`]="{ item }">{{ formatSize(item.size) }}</template>
    <template #[`item.sharing`]="{ item }">{{ sharing(item) }}</template>
    <template #[`item.actions`]="{ item }">
      <v-btn
        size="small"
        variant="text"
        icon="mdi-pencil-outline"
        :aria-label="`Edit ${item.name}`"
        @click="openForm(item)"
      />
      <v-btn
        size="small"
        variant="text"
        icon="mdi-refresh"
        :aria-label="`Export a new version of ${item.name}`"
        @click="openReexport(item)"
      />
      <v-btn
        size="small"
        variant="text"
        icon="mdi-image-outline"
        :aria-label="`Set the cover of ${item.name}`"
        @click="pickCover(item)"
      />
      <v-btn
        size="small"
        variant="text"
        icon="mdi-download"
        :href="demoBundleUrl(item)"
        :aria-label="`Download ${item.name}`"
      />
      <v-btn
        size="small"
        variant="text"
        color="error"
        icon="mdi-delete-outline"
        :aria-label="`Delete ${item.name}`"
        @click="openDelete(item)"
      />
    </template>
  </v-data-table>

  <DemoFormDialog
    v-model="state.form.open"
    :demo="state.form.demo"
    :groups="state.groups"
    :desks="state.desks"
    :pending="state.form.pending"
    :error="state.form.error"
    @submit="submitForm"
  />

  <FormDialog
    v-model="state.reexport.open"
    title="Export a new version"
    submit-text="Export"
    :pending="state.reexport.pending"
    :error="state.reexport.error"
    @submit="submitReexport"
  >
    <p class="demos-tab__note">
      New copies use the new version. Desks that were already copied are not changed.
    </p>
    <v-select
      v-model="state.reexport.project"
      :items="state.desks"
      item-title="label"
      item-value="@rid"
      label="Desk"
      variant="outlined"
      density="comfortable"
    />
  </FormDialog>

  <ConfirmDialog
    v-model="state.remove.open"
    title="Delete demo"
    :message="`Delete the demo “${state.remove.demo?.name}”? Desks already copied from it stay.`"
    confirm-text="Delete"
    danger
    :loading="state.remove.pending"
    :error="state.remove.error"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
.demos-tab__toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--md-space-2);
  margin-block-end: var(--md-space-3);
}

.demos-tab__note {
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
