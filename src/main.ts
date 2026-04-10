import { createApp } from 'vue'
import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'
import './style.css'
import './styles/themes.less'
import { useTheme } from './composables/useTheme'
import App from './App.vue'

// Apply saved theme preference (or system default) before first paint
useTheme()
import router from './router'

const app = createApp(App)
app.use(FloatingVue)
app.use(router)
app.mount('#app')
