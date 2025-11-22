# Auto Form Vue

> Powerful Vue component for building dynamic, multi-step forms with automatic validation, field dependencies, and a [visual form builder](https://riceball-tw.github.io/auto-form-vue/).

The `AutoForm.vue` component is base on:

- [Vue 3](https://vuejs.org/)
- [Zod](https://zod.dev/)
- [Vee-Validate](https://vee-validate.logaretm.com/v4/guide/overview/)
- [Shadcn Vue](https://www.shadcn-vue.com/)

## Installation

Just copy-paste [components](https://github.com/riceball-tw/auto-form-vue/tree/main/src/components) folder :)

## Quick Start

```vue
<script setup lang="ts">
import { AutoForm } from 'auto-form-vue'
import { z } from 'zod'

const formSchema = {
  steps: [
    {
      title: 'Personal Information',
      description: 'Tell us about yourself',
      fields: {
        name: {
          label: 'Full Name',
          id: 'name',
          as: 'input' as const,
          rules: z.string().min(2, 'Name must be at least 2 characters'),
          placeholder: 'Enter your full name'
        },
        email: {
          label: 'Email',
          id: 'email',
          as: 'input' as const,
          rules: z.string().email('Invalid email address'),
          placeholder: 'Enter your email'
        }
      }
    }
  ]
}

const handleSubmit = (data: any) => {
  console.log('Form submitted:', data)
}
</script>

<template>
  <AutoForm :schema="formSchema" :on-submit="handleSubmit" />
</template>
```

## Field Types

- `input` - Text input field
- `textarea` - Multi-line text input
- `select` - Dropdown selection
- `checkbox` - Multiple choice checkboxes
- `switch` - Boolean toggle

## Advanced Features

### Field Dependencies

```typescript
const fieldWithDependency = {
  label: 'State',
  id: 'state',
  as: 'select' as const,
  rules: z.string(),
  options: [], // Will be set dynamically
  dependencies: [
    {
      sourceField: 'country',
      type: 'SETS_OPTIONS',
      when: (sourceValue: string) => sourceValue === 'US',
      options: [
        { label: 'California', value: 'CA' },
        { label: 'New York', value: 'NY' }
      ]
    }
  ]
}
```

### Multi-step Forms

```typescript
const multiStepSchema = {
  steps: [
    {
      title: 'Step 1',
      description: 'First step',
      fields: { /* fields */ }
    },
    {
      title: 'Step 2',
      description: 'Second step',
      fields: { /* fields */ }
    }
  ]
}
```

## API Reference

### AutoForm Props

- `schema` - Form schema object defining steps and fields
- `onSubmit` - Function called when form is submitted with valid data
- `initialValues` - Optional initial form values

### Field Configuration

Each field in the schema supports:

- `label` - Display label
- `id` - Unique field identifier
- `as` - Field type ('input' | 'textarea' | 'select' | 'checkbox' | 'switch')
- `rules` - Zod validation schema
- `placeholder` - Input placeholder text
- `options` - Array of {label, value} for select/checkbox fields
- `dependencies` - Array of field dependencies

## License

MIT
