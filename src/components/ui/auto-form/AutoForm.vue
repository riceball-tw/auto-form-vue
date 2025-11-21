<script setup lang="ts" generic="T extends { fields: Record<string, FieldConfig> }">
import { computed, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { FieldGroup } from '@/components/ui/field'
import AutoField from './AutoField.vue'
import type { FieldConfig, InferFormData } from './types'

const props = defineProps<{
  schema: T
  onSubmit: (data: InferFormData<T>) => void
  initialValues?: Partial<InferFormData<T>>
}>()

const zodSchema = computed(() => {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const [key, field] of Object.entries(props.schema.fields)) {
    shape[key] = field.rules
  }
  return z.object(shape)
})

const typedSchema = computed(() => toTypedSchema(zodSchema.value))

const { handleSubmit, resetForm, setValues } = useForm({
  validationSchema: typedSchema.value as any,
  initialValues: props.initialValues as any || {},
})

// Watch for changes to initialValues and update the form
watch(() => props.initialValues, (newValues) => {
  if (newValues) {
    setValues(newValues as any)
  }
}, { deep: true })

const fields = computed(() => Object.values(props.schema.fields))

const onFormSubmit = handleSubmit((data) => {
  props.onSubmit(data)
})
</script>

<template>
  <form @submit="onFormSubmit">
    <FieldGroup>
      <AutoField
        v-for="field in fields"
        :key="field.id"
        :config="field"
      />
    </FieldGroup>
    <slot name="actions" :reset-form="resetForm" />
  </form>
</template>