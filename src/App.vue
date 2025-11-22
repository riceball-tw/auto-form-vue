<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
import FormBuilder from '@/components/FormBuilder.vue'
import { Navbar } from '@/components/ui/navbar'
</script>

<template>
  <div class="w-full min-h-screen bg-background">
    <Navbar />
    <div class="container mx-auto py-8">
      <FormBuilder />
    </div>
  </div>
  <Toaster />
</template>

