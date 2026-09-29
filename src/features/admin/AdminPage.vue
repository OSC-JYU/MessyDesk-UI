<script setup>
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  createServiceGroup,
  createUser,
  deleteServiceGroup,
  getPermissionRequests,
  getServiceGroups,
  getUsers,
  removePermissionRequest,
  updateServiceGroup,
  updateUserServiceGroups,
  uploadServiceGroupLogo,
} from '@/api/admin.js'
import { getServices } from '@/api/services.js'
import { toServiceList } from '@/features/services/serviceStatus.js'
import PageHeader from '@/ui/PageHeader.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import LoadingState from '@/ui/LoadingState.vue'
import ConfirmDialog from '@/ui/ConfirmDialog.vue'
import FormDialog from '@/ui/FormDialog.vue'
import RequestsTab from './RequestsTab.vue'
import UsersTab from './UsersTab.vue'
import AdminServicesTab from './AdminServicesTab.vue'
import ServiceGroupsTab from './ServiceGroupsTab.vue'

const route = useRoute()
const router = useRouter()

const TABS = [
  { value: 'requests', label: 'Requests' },
  { value: 'users', label: 'Users' },
  { value: 'services', label: 'Services' },
  { value: 'groups', label: 'Service groups' },
]

// The open tab is kept in the URL (?tab=users) so reloads and links keep it.
const tab = computed({
  get: () => (TABS.some((t) => t.value === route.query.tab) ? route.query.tab : 'requests'),
  set: (value) => router.replace({ query: { ...route.query, tab: value } }),
})

const state = reactive({
  loading: true,
  error: null,
  requests: [],
  users: [],
  services: [],
  groups: [],
  userForm: { open: false, label: '', email: '', fromRequest: null, pending: false, error: null },
  groupForm: { open: false, id: '', name: '', description: '', pending: false, error: null },
  groupDelete: { open: false, group: null, pending: false, error: '' },
})

const groupIds = computed(() => state.groups.map((g) => g.id))

async function guard(action) {
  try {
    state.error = null
    await action()
  } catch (error) {
    state.error = error
  }
}

async function loadAll() {
  await guard(async () => {
    const [requests, users, groups, services] = await Promise.all([
      getPermissionRequests(),
      getUsers(),
      getServiceGroups(),
      getServices(),
    ])
    Object.assign(state, { requests, users, groups, services: toServiceList(services) })
  })
  state.loading = false
}

function openUserForm(request = null) {
  Object.assign(state.userForm, {
    open: true,
    label: request?.label && request.label !== request.id ? request.label : '',
    email: request?.id || '',
    fromRequest: request?.['@rid'] || null,
    pending: false,
    error: null,
  })
  if (request) tab.value = 'users'
}

async function submitUser() {
  const form = state.userForm
  if (!form.email.trim()) {
    form.error = 'Give the user an email address.'
    return
  }
  form.pending = true
  form.error = null
  try {
    await createUser({ label: form.label.trim(), id: form.email.trim() })
    if (form.fromRequest) await removePermissionRequest(form.fromRequest)
    form.open = false
    await loadAll()
  } catch (error) {
    form.error = error
  } finally {
    form.pending = false
  }
}

async function removeRequest(request) {
  await guard(async () => {
    await removePermissionRequest(request['@rid'])
    state.requests = await getPermissionRequests()
  })
}

function openGroupForm() {
  Object.assign(state.groupForm, {
    open: true,
    id: '',
    name: '',
    description: '',
    pending: false,
    error: null,
  })
}

async function submitGroup() {
  const form = state.groupForm
  if (!/^[A-Za-z0-9_-]+$/.test(form.id.trim())) {
    form.error = 'The id may only contain letters, numbers, _ and -.'
    return
  }
  form.pending = true
  form.error = null
  try {
    await createServiceGroup({ id: form.id.trim(), name: form.name, description: form.description })
    form.open = false
    state.groups = await getServiceGroups()
  } catch (error) {
    form.error = error
  } finally {
    form.pending = false
  }
}

const saveGroup = (group) =>
  guard(() => updateServiceGroup(group.id, { name: group.name, description: group.description }))

async function uploadLogo(group, file) {
  await guard(async () => Object.assign(group, await uploadServiceGroupLogo(group.id, file)))
}

function askDeleteGroup(group) {
  Object.assign(state.groupDelete, { open: true, group, pending: false, error: '' })
}

async function confirmDeleteGroup() {
  const del = state.groupDelete
  del.pending = true
  try {
    await deleteServiceGroup(del.group.id)
    state.groups = await getServiceGroups()
    del.open = false
  } catch (error) {
    del.error = error?.message || 'Could not delete the service group.'
  } finally {
    del.pending = false
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="admin-page">
    <PageHeader title="Admin" subtitle="Access requests, users, services and service groups." />

    <ErrorAlert :error="state.error" title="Admin action failed" class="mb-4" />

    <v-card rounded="lg" flat class="admin-page__card">
      <v-tabs v-model="tab" color="primary" class="admin-page__tabs">
        <v-tab v-for="t in TABS" :key="t.value" :value="t.value">
          {{ t.label }}
          <v-badge
            v-if="t.value === 'requests' && state.requests.length"
            :content="state.requests.length"
            color="warning"
            inline
          />
        </v-tab>
      </v-tabs>
      <LoadingState v-if="state.loading" text="Loading…" />
      <v-tabs-window v-else v-model="tab" class="admin-page__body">
        <v-tabs-window-item value="requests">
          <RequestsTab :requests="state.requests" @accept="openUserForm" @remove="removeRequest" />
        </v-tabs-window-item>
        <v-tabs-window-item value="users">
          <UsersTab
            :users="state.users"
            :group-ids="groupIds"
            @add="openUserForm()"
            @update-groups="
              (user) =>
                guard(() => updateUserServiceGroups(user['@rid'], user.service_groups || []))
            "
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="services">
          <AdminServicesTab :services="state.services" />
        </v-tabs-window-item>
        <v-tabs-window-item value="groups">
          <ServiceGroupsTab
            :groups="state.groups"
            :upload-logo="uploadLogo"
            @add="openGroupForm"
            @save="saveGroup"
            @delete="askDeleteGroup"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>

    <FormDialog
      v-model="state.userForm.open"
      title="Add user"
      submit-text="Create user"
      :pending="state.userForm.pending"
      :error="state.userForm.error"
      @submit="submitUser"
    >
      <v-text-field
        v-model="state.userForm.label"
        label="Name (Lastname, Firstname)"
        variant="outlined"
        density="comfortable"
      />
      <v-text-field
        v-model="state.userForm.email"
        label="Email"
        type="email"
        variant="outlined"
        density="comfortable"
      />
      <p v-if="state.userForm.fromRequest" class="admin-page__note">
        Creating the user also removes their access request.
      </p>
    </FormDialog>

    <FormDialog
      v-model="state.groupForm.open"
      title="Add service group"
      submit-text="Create group"
      :pending="state.groupForm.pending"
      :error="state.groupForm.error"
      @submit="submitGroup"
    >
      <v-text-field
        v-model="state.groupForm.id"
        label="Id"
        hint="Referenced from service_groups in service.json. Letters, numbers, _ and - only."
        persistent-hint
        variant="outlined"
        density="comfortable"
        class="mb-3"
      />
      <v-text-field
        v-model="state.groupForm.name"
        label="Name"
        variant="outlined"
        density="comfortable"
      />
      <v-textarea
        v-model="state.groupForm.description"
        label="Description"
        variant="outlined"
        rows="2"
      />
    </FormDialog>

    <ConfirmDialog
      v-model="state.groupDelete.open"
      title="Delete service group"
      :message="`Delete the service group “${state.groupDelete.group?.id}”?`"
      confirm-text="Delete"
      danger
      :loading="state.groupDelete.pending"
      :error="state.groupDelete.error"
      @confirm="confirmDeleteGroup"
    />
  </div>
</template>

<style scoped>
.admin-page {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-7);
}

.admin-page__card {
  border: 1px solid var(--md-color-border);
  box-shadow: var(--md-shadow-1);
}

.admin-page__tabs {
  border-bottom: 1px solid var(--md-color-border);
}

.admin-page__body {
  padding: var(--md-space-4) var(--md-space-5);
}

.admin-page__note {
  margin: 0;
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}
</style>
