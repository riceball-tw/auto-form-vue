import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { useTheme } from './composables/use-theme'

const app = createApp(App)
app.mount('#app')

// Initialize theme
const { initTheme } = useTheme()
initTheme()
