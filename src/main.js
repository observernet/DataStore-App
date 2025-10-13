import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

import './assets/style.css'

const app = createApp(App)
.use(createPinia())
.use(router)
.use(i18n)
.mount('#app')