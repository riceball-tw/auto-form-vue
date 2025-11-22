<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
import { h, ref } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { AutoForm } from '@/components/ui/auto-form'
import FormBuilder from '@/components/FormBuilder.vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const activeView = ref('example')

const step1 = {
  title: 'Basic Fields',
  description: 'Demonstrate input, textarea, and switch fields',
  fields: {
    name: {
      label: 'Full Name',
      id: 'name',
      as: 'input' as const,
      rules: z.string().min(1, 'Name is required').describe('Your full name'),
      placeholder: 'Enter your full name',
    },
    email: {
      label: 'Email',
      id: 'email',
      as: 'input' as const,
      rules: z.string().email('Invalid email').describe('Your email address'),
      placeholder: 'Enter your email',
    },
    bio: {
      label: 'Bio',
      id: 'bio',
      as: 'textarea' as const,
      rules: z.string().max(500, 'Bio too long').describe('Tell us about yourself'),
      placeholder: 'Write a short bio...',
    },
    newsletter: {
      label: 'Subscribe to Newsletter',
      id: 'newsletter',
      as: 'switch' as const,
      rules: z.boolean().describe('Subscribe to our newsletter'),
    },
  }
}

const step2 = {
  title: 'Selection Fields',
  description: 'Demonstrate select and checkbox fields',
  fields: {
    country: {
      label: 'Country',
      id: 'country',
      as: 'select' as const,
      rules: z.string().describe('Select your country'),
      options: [
        { label: 'United States', value: 'us' },
        { label: 'Canada', value: 'ca' },
        { label: 'United Kingdom', value: 'uk' },
        { label: 'Australia', value: 'au' },
      ],
    },
    interests: {
      label: 'Interests',
      id: 'interests',
      as: 'checkbox' as const,
      rules: z.array(z.string()).min(1, 'Select at least one interest').describe('Select your interests'),
      options: [
        { label: 'Technology', value: 'tech' },
        { label: 'Sports', value: 'sports' },
        { label: 'Music', value: 'music' },
        { label: 'Travel', value: 'travel' },
        { label: 'Food', value: 'food' },
      ],
    },
  }
}

const step3 = {
  title: 'Dependencies Demo',
  description: 'Show HIDES and SETS_OPTIONS dependencies',
  fields: {
    age: {
      label: 'Age',
      id: 'age',
      as: 'input' as const,
      rules: z.string().regex(/^\d+$/, 'Must be a number').describe('Your age'),
      placeholder: 'Enter your age',
    },
    parentConsent: {
      label: 'Parent Consent',
      id: 'parentConsent',
      as: 'switch' as const,
      rules: z.boolean().describe('Parent consent required'),
      dependencies: [
        {
          sourceField: 'age',
          type: 'HIDES' as const,
          when: (sourceValue: string) => Number(sourceValue) >= 18,
        },
      ],
    },
    dietaryRestriction: {
      label: 'Dietary Restriction',
      id: 'dietaryRestriction',
      as: 'select' as const,
      rules: z.string().describe('Select dietary restriction'),
      options: [
        { label: 'None', value: 'none' },
        { label: 'Vegetarian', value: 'vegetarian' },
        { label: 'Vegan', value: 'vegan' },
        { label: 'Gluten-Free', value: 'gluten-free' },
      ],
    },
    mealChoice: {
      label: 'Meal Choice',
      id: 'mealChoice',
      as: 'select' as const,
      rules: z.string().describe('Select your meal'),
      options: [
        { label: 'Grilled Chicken', value: 'chicken' },
        { label: 'Beef Steak', value: 'beef' },
        { label: 'Salmon', value: 'salmon' },
        { label: 'Pasta', value: 'pasta' },
        { label: 'Salad', value: 'salad' },
      ],
      dependencies: [
        {
          sourceField: 'dietaryRestriction',
          type: 'SETS_OPTIONS' as const,
          when: (sourceValue: string) => sourceValue === 'vegetarian',
          options: [
            { label: 'Pasta', value: 'pasta' },
            { label: 'Salad', value: 'salad' },
            { label: 'Vegetable Stir Fry', value: 'veg-stir-fry' },
          ],
        },
        {
          sourceField: 'dietaryRestriction',
          type: 'SETS_OPTIONS' as const,
          when: (sourceValue: string) => sourceValue === 'vegan',
          options: [
            { label: 'Salad', value: 'salad' },
            { label: 'Vegetable Stir Fry', value: 'veg-stir-fry' },
            { label: 'Quinoa Bowl', value: 'quinoa' },
          ],
        },
      ],
    },
    additionalMeals: {
      label: 'Additional Meals',
      id: 'additionalMeals',
      as: 'checkbox' as const,
      rules: z.array(z.string()).describe('Select additional meals'),
      options: [
        { label: 'Soup', value: 'soup' },
        { label: 'Dessert', value: 'dessert' },
        { label: 'Beverage', value: 'beverage' },
      ],
      dependencies: [
        {
          sourceField: 'dietaryRestriction',
          type: 'SETS_OPTIONS' as const,
          when: (sourceValue: string) => sourceValue === 'vegan',
          options: [
            { label: 'Fruit Salad', value: 'fruit-salad' },
            { label: 'Vegan Dessert', value: 'vegan-dessert' },
            { label: 'Herbal Tea', value: 'herbal-tea' },
          ],
        },
      ],
    },
  }
}

const formSchema = {
  steps: [step1, step2, step3],
}
</script>

<template>
  <div class="w-full min-h-screen bg-background">
    <div class="container mx-auto py-8">
      <div class="flex items-center justify-between mb-8">
        <h1 class="text-3xl font-bold">AutoForm Vue</h1>
        <Tabs v-model="activeView" class="w-[400px]">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="example">Example</TabsTrigger>
            <TabsTrigger value="builder">Form Builder</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div v-if="activeView === 'example'" class="max-w-2xl mx-auto">
        <AutoForm
          :schema="formSchema"
          :on-submit="(submittedValue) => {
            toast('You submitted the following values:', {
              description: h('pre', { class: 'bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4' }, h('code', JSON.stringify(submittedValue, null, 2))),
            })
          }"
          :initial-values="{ name: 'John Doe', email: 'john@example.com', bio: 'Hello world', newsletter: true, country: 'us', interests: ['tech', 'music'], age: '25', parentConsent: false, dietaryRestriction: 'none', mealChoice: 'chicken', additionalMeals: ['soup'] }"
        />
      </div>

      <div v-else-if="activeView === 'builder'" class="w-full">
        <FormBuilder />
      </div>
    </div>
  </div>

  <Toaster />
</template>

