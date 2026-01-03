import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../components/Dashboard.vue'
import DeviceDebug from '../components/DeviceDebug.vue'
import Theater from '../components/Theater.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
