<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useTheme } from '@/composables/use-theme'
import { Moon, Sun } from 'lucide-vue-next'

interface Props {
  title?: string
}

const { title = 'Form Builder' } = defineProps<Props>()

const { theme, setTheme } = useTheme()

const toggleTheme = () => {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}
</script>

<template>
  <nav class="flex items-center justify-between py-4 px-6 border-b bg-background">
    <div class="flex items-center space-x-4">
      <h1 class="text-2xl font-bold">{{ title }}</h1>
    </div>
    <div class="flex items-center space-x-2">
      <Button variant="outline" size="icon" @click="toggleTheme" aria-label="Toggle theme">
        <Sun v-if="theme === 'light'" class="h-4 w-4" />
        <Moon v-else class="h-4 w-4" />
      </Button>
    </div>
  </nav>
</template>