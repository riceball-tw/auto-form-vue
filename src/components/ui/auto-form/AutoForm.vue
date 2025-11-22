<script setup lang="ts" generic="T extends { fields: Record<string, FieldConfig> }">
import { computed, watch } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useFormValues } from 'vee-validate'
import { z } from 'zod'
import { FieldGroup } from '@/components/ui/field'
import AutoField from './AutoField.vue'
import type { FieldConfig, InferFormData } from './types'
import { DependencyType } from './types'

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

const formValues = useFormValues()

// Watch for changes to initialValues and update the form
watch(() => props.initialValues, (newValues) => {
  if (newValues) {
    setValues(newValues as any)
  }
}, { deep: true })

const fields = computed(() => {
  const allFields = Object.values(props.schema.fields)
  return allFields.filter(field => {
    const dependencies = field.dependencies || []
    for (const dep of dependencies) {
      if (dep.type === 'HIDES') {
        const sourceValue = (formValues.value as any)?.[dep.sourceField]
        if (dep.when(sourceValue)) {
          return false
        }
      }
    }
    return true
  }).map(field => {
    let modifiedField = { ...field }
    const dependencies = field.dependencies || []
    for (const dep of dependencies) {
      if (dep.type === 'SETS_OPTIONS') {
        const sourceValue = (formValues.value as any)?.[dep.sourceField]
        const targetValue = (formValues.value as any)?.[field.id]
        if (dep.when(sourceValue, targetValue)) {
          (modifiedField as any).options = dep.options || []
        }
      }
    }
    return modifiedField
  })
})

// Function to reset invalid field values when options change
const resetInvalidFieldValues = () => {
  for (const field of fields.value) {
    const currentValue = (formValues.value as Record<string, unknown>)[field.id]

    if (field.as === 'select') {
      // For select fields, if current value is not in options, reset to first option
      const options = field.options
      const selectValue = currentValue as string | undefined
      if (selectValue && !options.some(opt => opt.value === selectValue)) {
        setValues({ [field.id]: options[0]?.value || '' })
      }
    } else if (field.as === 'checkbox') {
      // For checkbox fields, filter out invalid values
      const options = field.options
      const checkboxValue = currentValue as string[] | undefined
      if (Array.isArray(checkboxValue)) {
        const validValues = checkboxValue.filter(val => options.some(opt => opt.value === val))
        if (validValues.length !== checkboxValue.length) {
          setValues({ [field.id]: validValues })
        }
      }
    }
  }
}

// Watch for field changes and reset invalid values
watch(fields, resetInvalidFieldValues, { deep: true })

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