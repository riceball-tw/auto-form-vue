import { ref, watch } from 'vue'

const theme = ref<'light' | 'dark' | 'system'>('system')

const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
  const root = document.documentElement

  if (newTheme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    root.classList.toggle('dark', systemTheme === 'dark')
  } else {
    root.classList.toggle('dark', newTheme === 'dark')
  }
}

const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
  theme.value = newTheme
  localStorage.setItem('theme', newTheme)
  applyTheme(newTheme)
}

const initTheme = () => {
  const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
  if (stored) {
    theme.value = stored
  }
  applyTheme(theme.value)

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') {
      applyTheme('system')
    }
  })
}

watch(theme, (newTheme) => {
  applyTheme(newTheme)
})

export const useTheme = () => {
  return {
    theme,
    setTheme,
    initTheme,
  }
}