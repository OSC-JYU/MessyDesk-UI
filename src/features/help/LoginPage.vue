<script setup>
import { onMounted, reactive } from 'vue'
import { addPermissionRequest, getSsoUser } from '@/api/session.js'
import ErrorAlert from '@/ui/ErrorAlert.vue'
import notRegistered from '@/assets/images/not_registered.jpg'
import organisationLogo from '@/assets/images/organisation.png'

// Shown to someone signed in through SSO who has no MessyDesk account yet.
// They can ask an admin for access.
const state = reactive({
  user: { mail: '', name: '' },
  sending: false,
  sent: false,
  error: '',
})

async function sendRequest() {
  state.sending = true
  state.error = ''
  try {
    await addPermissionRequest()
    state.sent = true
  } catch {
    state.error = 'register.request_error'
  } finally {
    state.sending = false
  }
}

onMounted(async () => {
  try {
    state.user = { mail: '', name: '', ...(await getSsoUser()) }
  } catch {
    // Without SSO details the page still lets them send a request.
  }
})
</script>

<template>
  <main class="login-page">
    <v-card class="login-card" rounded="lg" elevation="3">
      <v-img :src="notRegistered" height="180" cover alt="" />
      <div class="login-card__body">
        <h1 class="login-card__title">MessyDesk</h1>

        <div v-if="state.user.mail || state.user.name" class="login-card__user">
          <v-chip
            v-if="state.user.mail"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-email-outline"
          >
            {{ state.user.mail }}
          </v-chip>
          <v-chip v-if="state.user.name" variant="tonal" prepend-icon="mdi-account-outline">
            {{ state.user.name }}
          </v-chip>
        </div>

        <v-alert type="warning" variant="tonal" class="mb-4">
          {{ $t('register.not_registered') }}
        </v-alert>

        <p class="login-card__organisation">{{ $t('register.organisation') }}</p>

        <v-alert v-if="state.sent" type="success" variant="tonal">
          {{ $t('register.request_success') }}
        </v-alert>
        <template v-else>
          <ErrorAlert :error="state.error && $t(state.error)" title="" class="mb-4" />
          <div class="login-card__actions">
            <v-btn color="primary" variant="flat" :loading="state.sending" @click="sendRequest">
              {{ $t('register.request_button') }}
            </v-btn>
          </div>
        </template>
      </div>
    </v-card>
    <img :src="organisationLogo" alt="University of Jyväskylä" class="login-page__logo" />
  </main>
</template>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--md-space-6);
  padding: var(--md-space-6) var(--md-space-4);
  background: var(--md-color-bg);
}

.login-card {
  width: 100%;
  max-width: var(--md-dialog-width);
  overflow: hidden;
}

.login-card__body {
  padding: var(--md-space-5) var(--md-space-6) var(--md-space-6);
}

.login-card__title {
  margin: 0 0 var(--md-space-4);
  font-size: var(--md-font-size-2xl);
  color: var(--md-color-header);
}

.login-card__user {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-2);
  margin-block-end: var(--md-space-4);
}

.login-card__organisation {
  margin: 0 0 var(--md-space-4);
  color: var(--md-color-text-muted);
}

.login-card__actions {
  display: flex;
  justify-content: flex-end;
}

.login-page__logo {
  height: var(--md-logo-size-lg);
  width: auto;
}
</style>
