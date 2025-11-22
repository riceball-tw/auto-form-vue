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

const formSchema = {
  fields: {
    title: {
      label: 'Bug Title',
      id: 'title',
      as: 'input' as const,
      rules: z
        .string()
        .min(5, 'Bug title must be at least 5 characters.')
        .max(32, 'Bug title must be at most 32 characters.')
        .describe('A brief title describing the bug'),
      placeholder: 'Enter a concise bug title',
    },
    description: {
      label: 'Description',
      id: 'description',
      as: 'textarea' as const,
      rules: z
        .string()
        .min(20, 'Description must be at least 20 characters.')
        .max(100, 'Description must be at most 100 characters.')
        .describe('Include steps to reproduce, expected behavior, and what actually happened.'),
      placeholder: 'Describe the bug in detail, including steps to reproduce...',
    },
    priority: {
      label: 'Priority',
      id: 'priority',
      as: 'select' as const,
      rules: z.string().describe('Select the priority level of the bug.'),
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
      ],
    },
    tags: {
      label: 'Tags',
      id: 'tags',
      as: 'checkbox' as const,
      rules: z.array(z.string()).describe('Select relevant tags for the bug.'),
      options: [
        { label: 'UI', value: 'ui' },
        { label: 'Backend', value: 'backend' },
        { label: 'Performance', value: 'performance' },
        { label: 'Security', value: 'security' },
      ],
    },
  },
}
</script>

<template>

  <Card class="w-full sm:max-w-md">
    <CardHeader>
      <CardTitle>Bug Report</CardTitle>
      <CardDescription>
        Help us improve by reporting bugs you encounter.
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
        :initial-values="{ title: 'Sample Bug Title', description: 'This is a sample description for testing the auto form.', priority: 'medium', tags: [] }"
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
