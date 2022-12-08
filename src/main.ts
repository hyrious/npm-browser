import { createPinia } from 'pinia'
import { createApp } from 'vue'

import 'uno.css'
import './style.css'
import App from './components/App.vue'

const pinna = createPinia()
const app = createApp(App)

app.use(pinna)
app.mount('#app')
