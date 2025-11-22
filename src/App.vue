<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
import { h } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { AutoForm } from '@/components/ui/auto-form'

// import { DependencyType } from '@/components/ui/auto-form'

const formSchema = {
  fields: {
    age: {
      label: 'Age',
      id: 'age',
      as: 'input' as const,
      rules: z.string().describe('Your age'),
      placeholder: 'Enter your age',
    },
    parentsAllowed: {
      label: 'Parents Allowed',
      id: 'parentsAllowed',
      as: 'switch' as const,
      rules: z.boolean().optional().describe('Are parents allowed?'),
      dependencies: [
        {
          sourceField: 'age',
          type: 'HIDES' as const,
          when: (sourceValue: string) => Number(sourceValue) >= 18,
        },
      ],
    },
    vegetarian: {
      label: 'Vegetarian',
      id: 'vegetarian',
      as: 'switch' as const,
      rules: z.boolean().describe('Are you vegetarian?'),
    },
    mealOptions: {
      label: 'Meal Options',
      id: 'mealOptions',
      as: 'select' as const,
      rules: z.string().describe('Select your meal'),
      options: [
        { label: 'Pasta', value: 'Pasta' },
        { label: 'Salad', value: 'Salad' },
        { label: 'Beef Wellington', value: 'Beef Wellington' },
        { label: 'Chicken', value: 'Chicken' },
      ],
      dependencies: [
        {
          sourceField: 'vegetarian',
          type: 'SETS_OPTIONS' as const,
          when: (sourceValue: boolean, targetValue: string) => sourceValue,
          options: [
            { label: 'Pasta', value: 'Pasta' },
            { label: 'Salad', value: 'Salad' },
          ],
        },
      ],
    },
    mealOptionsMulti: {
      label: 'Meal Options Multi',
      id: 'mealOptionsMulti',
      as: 'checkbox' as const,
      rules: z.array(z.string()).describe('Select your meals'),
      options: [
        { label: 'Pasta', value: 'Pasta' },
        { label: 'Salad', value: 'Salad' },
        { label: 'Beef Wellington', value: 'Beef Wellington' },
        { label: 'Chicken', value: 'Chicken' },
      ],
      dependencies: [
        {
          sourceField: 'vegetarian',
          type: 'SETS_OPTIONS' as const,
          when: (sourceValue: boolean, targetValue: string[]) => sourceValue,
          options: [
            { label: 'Pasta', value: 'Pasta' },
            { label: 'Salad', value: 'Salad' },
          ],
        },
      ],
    },

  },
}
</script>

<template>

  <Card class="w-full sm:max-w-md">
    <CardHeader>
      <CardTitle>Form with Dependencies</CardTitle>
      <CardDescription>
        Example of field dependencies: age hides parentsAllowed when >=18, vegetarian filters meal options.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <AutoForm
        :schema="formSchema"
        :on-submit="(submittedValue) => {
          toast('You submitted the following values:', {
            description: h('pre', { class: 'bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4' }, h('code', JSON.stringify(submittedValue, null, 2))),
          })
        }"
        :initial-values="{ age: '16', parentsAllowed: true, vegetarian: false, mealOptions: 'Pasta', mealOptionsMulti: [] }"
      >
        <template #actions="{ resetForm }">
          <Field orientation="horizontal">
            <Button type="button" variant="outline" @click="resetForm">
              Reset
            </Button>
            <Button type="submit">
              Submit
            </Button>
          </Field>
        </template>
      </AutoForm>
    </CardContent>
  </Card>

  <Toaster />
</template>
