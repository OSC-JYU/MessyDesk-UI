<script setup>
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { session } from '@/stores/session.js'
import { settings, saveSetting } from '@/stores/settings.js'
import { getSsoUser } from '@/api/session.js'
import SectionCard from '@/ui/SectionCard.vue'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import organisationLogo from '@/assets/images/organisation.png'
import { useDesks } from './useDesks.js'
import { useDemos } from './useDemos.js'
import LearnCard from './LearnCard.vue'
import DeskTable from './DeskTable.vue'
import DeskGrid from './DeskGrid.vue'
import CreateDeskCard from './CreateDeskCard.vue'
import RenameDeskDialog from './RenameDeskDialog.vue'
import ReindexDeskDialog from './ReindexDeskDialog.vue'
import DeleteDeskDialog from './DeleteDeskDialog.vue'
import StorageCard from './StorageCard.vue'
import RunningJobsCard from './RunningJobsCard.vue'
import ActiveCrunchersCard from './ActiveCrunchersCard.vue'
import NewsCard from './NewsCard.vue'

const router = useRouter()
const desks = useDesks()
const demos = useDemos()

const view = reactive({
  hidSnackbar: false,
  error: null,
})
const dialogs = reactive({ desk: null, rename: false, reindex: false, delete: false })
const signedInAs = reactive({ name: '' })

function openDialog(kind, desk) {
  dialogs.desk = desk
  dialogs[kind] = true
}

async function createAndOpen(name) {
  const rid = await desks.create(name)
  if (rid) router.push({ name: 'project-graph', params: { rid } })
}

async function setView(value) {
  if (!value || value === settings.desk_view) return
  try {
    await saveSetting('desk_view', value)
  } catch (error) {
    view.error = error
  }
}

async function hideDemos() {
  try {
    await saveSetting('hide_demos', 'on')
    view.hidSnackbar = true
  } catch (error) {
    view.error = error
  }
}

// The copy opens right away; it also appears in the desk list.
async function copyDemo(demo) {
  const rid = await demos.copy(demo)
  if (!rid) return
  router.push({ name: 'project-graph', params: { rid } })
}

onMounted(async () => {
  desks.load()
  demos.load()
  try {
    signedInAs.name = (await getSsoUser()).mail || ''
  } catch {
    // Falls back to the MessyDesk user id below.
  }
})
</script>

<template>
  <div class="home">
    <header class="home__hero">
      <div>
        <h1 class="home__title">Digitally JYUrs</h1>
        <p class="home__welcome">Welcome to the next version of MessyDesk!</p>
      </div>
      <div class="home__identity">
        <img :src="organisationLogo" alt="University of Jyväskylä" class="home__logo" />
        <p v-if="signedInAs.name || session.user" class="home__user">
          Signed in as <strong>{{ signedInAs.name || session.user?.id }}</strong>
        </p>
      </div>
    </header>

    <div class="home__grid">
      <div class="home__main">
        <LearnCard
          v-if="settings.hide_demos !== 'on'"
          :demos="demos.state.demos"
          :importing="demos.state.importing"
          :copied="demos.state.copied"
          :error="demos.state.error"
          @copy="copyDemo"
          @hide="hideDemos"
        />

        <CreateDeskCard :create="createAndOpen" />

        <SectionCard overline="Your desks" title="Desks">
          <template #actions>
            <v-btn-toggle
              :model-value="settings.desk_view"
              mandatory
              density="comfortable"
              variant="text"
              color="primary"
              aria-label="Desk view"
              @update:model-value="setView"
            >
              <v-btn
                value="grid"
                icon="mdi-view-grid-outline"
                size="small"
                aria-label="Grid view"
              />
              <v-btn
                value="list"
                icon="mdi-view-list-outline"
                size="small"
                aria-label="List view"
              />
            </v-btn-toggle>
            <v-btn
              variant="text"
              size="small"
              prepend-icon="mdi-refresh"
              :loading="desks.state.loading"
              @click="desks.refresh"
            >
              Refresh
            </v-btn>
          </template>
          <ErrorAlert
            :error="desks.state.error"
            title="Could not load your desks"
            retryable
            class="mb-3"
            @retry="desks.load"
          />
          <ErrorAlert :error="view.error" title="Could not save the setting" class="mb-3" />
          <DeskGrid
            v-if="settings.desk_view === 'grid'"
            :rows="desks.rows.value"
            :loading="desks.state.loading"
            @rename="openDialog('rename', $event)"
            @reindex="openDialog('reindex', $event)"
            @delete="openDialog('delete', $event)"
          />
          <DeskTable
            v-else
            :rows="desks.rows.value"
            :loading="desks.state.loading"
            :sort-key="desks.state.sortKey"
            :sort-direction="desks.state.sortDirection"
            @sort="desks.sortBy"
            @rename="openDialog('rename', $event)"
            @reindex="openDialog('reindex', $event)"
            @delete="openDialog('delete', $event)"
          />
        </SectionCard>
      </div>

      <aside class="home__side">
        <StorageCard :storage="desks.state.storage" />
        <RunningJobsCard />
        <ActiveCrunchersCard />
        <NewsCard />
      </aside>
    </div>

    <footer class="home__footer">
      Created by the Open Science Centre, University of Jyväskylä ·
      <a href="https://github.com/OSC-JYU/MessyDesk" target="_blank" rel="noopener noreferrer">
        MessyDesk on GitHub
      </a>
    </footer>

    <v-snackbar v-model="view.hidSnackbar" timeout="6000">
      Learn MessyDesk is hidden. Show it again in Settings → Front page.
    </v-snackbar>
    <RenameDeskDialog v-model="dialogs.rename" :desk="dialogs.desk" :rename="desks.rename" />
    <ReindexDeskDialog v-model="dialogs.reindex" :desk="dialogs.desk" :reindex="desks.reindex" />
    <DeleteDeskDialog v-model="dialogs.delete" :desk="dialogs.desk" :remove="desks.remove" />
  </div>
</template>

<style scoped>
.home {
  max-width: var(--md-content-max-width);
  margin: 0 auto;
  padding: var(--md-space-6) var(--md-space-5) var(--md-space-5);
}

.home__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-5);
  margin-block-end: var(--md-space-6);
}

.home__title {
  margin: 0;
  font-size: calc(var(--md-font-size-2xl) * 1.5);
  line-height: 1.1;
  color: var(--md-color-header);
}

.home__welcome {
  margin: var(--md-space-2) 0 0;
  font-size: var(--md-font-size-lg);
  color: var(--md-color-text-muted);
}

.home__identity {
  display: flex;
  align-items: center;
  gap: var(--md-space-4);
  padding: var(--md-space-3) var(--md-space-5);
  border: 1px solid var(--md-color-border);
  border-radius: var(--md-radius-lg);
  background: var(--md-color-surface);
}

.home__logo {
  height: var(--md-logo-size-lg);
  width: auto;
}

.home__user {
  margin: 0;
  color: var(--md-color-text-muted);
}

.home__user strong {
  color: var(--md-color-text);
  font-weight: var(--md-font-weight-medium);
}

.home__grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(var(--md-card-min-width), 1fr);
  gap: var(--md-space-5);
  align-items: start;
}

.home__main,
.home__side {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-5);
}

@media (max-width: 1100px) {
  .home__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.home__footer {
  margin-block-start: var(--md-space-7);
  padding-block-start: var(--md-space-4);
  border-top: 1px solid var(--md-color-border);
  font-size: var(--md-font-size-xs);
  color: var(--md-color-text-muted);
}

.home__footer a {
  color: var(--md-color-primary);
}
</style>
