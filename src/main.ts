import './assets/index.css'
// registers the spectral repository before anything asks for it
import './data/setup'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from "pinia-plugin-persistedstate"
import App from './App.vue'

const pinia = createPinia()
pinia.use(piniaPluginPersistedState)
const app = createApp(App)

app.use(pinia)

app.mount('#app')
