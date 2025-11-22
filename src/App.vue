<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
import { ref } from 'vue'
import FormBuilder from '@/components/FormBuilder.vue'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/composables/use-theme'
import { Moon, Sun } from 'lucide-vue-next'

const { theme, setTheme } = useTheme()

const toggleTheme = () => {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}
</script>

<template>
  <div class="w-full min-h-screen bg-background">
    <div class="container mx-auto py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold">Form Builder</h1>
        <Button variant="outline" size="icon" @click="toggleTheme">
          <Sun v-if="theme === 'light'" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </Button>
      </div>

      <FormBuilder />
    </div>
  </div>

  <Toaster />
</template>

