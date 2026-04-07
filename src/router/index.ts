import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import DeviceDebug from '../components/DeviceDebug.vue'
import Theater from '../components/Theater.vue'

import LoginView from '@new/components/auth/LoginView.vue'
import RegisterView from '@new/components/auth/RegisterView.vue'
import ForgotPasswordView from '@new/components/auth/ForgotPasswordView.vue'
import ResetPasswordView from '@new/components/auth/ResetPasswordView.vue'
import VerifyEmailView from '@new/components/auth/VerifyEmailView.vue'
import AccountView from '@new/components/auth/AccountView.vue'

import SessionsListView from '@new/components/studio/sessions/SessionsListView.vue'
import SessionEditorView from '@new/components/studio/sessions/SessionEditorView.vue'
import PlaylistsListView from '@new/components/studio/playlists/PlaylistsListView.vue'
import PlaylistEditorView from '@new/components/studio/playlists/PlaylistEditorView.vue'

import { auth } from '@/state/auth'

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'home',
    component: Dashboard,
    props: { initialTab: 'home' }
  },
  {
    path: '/sessions',
    name: 'sessions',
    component: Dashboard,
    props: { initialTab: 'start' }
  },
  {
    path: '/logs',
    name: 'logs',
    component: Dashboard,
    props: { initialTab: 'history' }
  },
  {
    path: '/subjects',
    name: 'subjects',
    component: Dashboard,
    props: { initialTab: 'users' }
  },
  {
    path: '/debug',
    name: 'debug',
    component: DeviceDebug
  },
  {
    path: '/theater/:sessionId/:subjectId?',
    name: 'theater',
    component: Theater,
    props: true
  },

  // --- Auth ---
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
  { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView, meta: { guestOnly: true } },
  { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { guestOnly: true } },
  { path: '/verify-email', name: 'verify-email', component: VerifyEmailView },
  { path: '/account', name: 'account', component: AccountView, meta: { requiresAuth: true } },

  // --- Studio (content management) ---
  {
    path: '/studio/sessions',
    name: 'studio-sessions',
    component: SessionsListView,
    meta: { requiresAuth: true }
  },
  {
    path: '/studio/sessions/:id',
    name: 'studio-session-edit',
    component: SessionEditorView,
    meta: { requiresAuth: true }
  },
  {
    path: '/studio/playlists',
    name: 'studio-playlists',
    component: PlaylistsListView,
    meta: { requiresAuth: true }
  },
  {
    path: '/studio/playlists/:id',
    name: 'studio-playlist-edit',
    component: PlaylistEditorView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  // Hydrate session state once so route guards have an accurate view of auth.
  await auth.hydrate()
  const signedIn = !!auth.state.user

  if (to.meta.requiresAuth && !signedIn) {
    return { path: '/login', query: { next: to.fullPath } }
  }
  if (to.meta.guestOnly && signedIn) {
    return { path: '/account' }
  }
  return true
})

export default router
