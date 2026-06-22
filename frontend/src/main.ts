import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { initPlatform } from './composables/usePlatform'

// Global styles
import './styles/variables.css'
import './styles/base.css'

// Detect platform early (before router resolves)
initPlatform()

// Detect Tauri environment for frameless window styling
if ('__TAURI__' in window) {
  document.documentElement.classList.add('tauri-app')
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
