import { createApp } from 'vue'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(FloatingVue)
app.use(router)
app.mount('#app')
