<script setup lang="ts" generic="T extends { steps: { title?: string; description?: string; fields: Record<string, FieldConfig> }[] }">
import { computed, watch, ref } from 'vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm, useFormValues } from 'vee-validate'
import { z } from 'zod'
import { Check, Circle, Dot } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Stepper, StepperDescription, StepperItem, StepperSeparator, StepperTitle, StepperTrigger } from '@/components/ui/stepper'
import { FieldGroup } from '@/components/ui/field'
import AutoField from './AutoField.vue'
import type { FieldConfig, InferFormData } from './types'

const props = defineProps<{
  schema: T
  onSubmit: (data: InferFormData) => void
  initialValues?: Partial<InferFormData>
}>()

const stepIndex = ref(1)

const steps = computed(() => props.schema.steps)

const currentStep = computed(() => steps.value[stepIndex.value - 1]!)

const allFieldsMap = computed(() => {
  const all = {} as Record<string, FieldConfig>
  for (const step of steps.value) {
    Object.assign(all, step.fields)
  }
  return all
})

const zodSchema = computed(() => {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const [key, field] of Object.entries(allFieldsMap.value)) {
    shape[key] = field.rules
  }
  return z.object(shape)
})

const typedSchema = computed(() => toTypedSchema(zodSchema.value))

const { handleSubmit, setValues, errors, validate } = useForm({
  validationSchema: typedSchema.value,
  initialValues: props.initialValues || {},
})

const formValues = useFormValues()

// Watch for changes to initialValues and update the form
watch(() => props.initialValues, (newValues) => {
  if (newValues) {
    setValues(newValues)
  }
}, { deep: true })

const fields = computed(() => {
  const allFields = Object.values(allFieldsMap.value)
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
        const targetValue = formValues.value?.[field.id]
        if (dep.when(sourceValue, targetValue)) {
          (modifiedField as any).options = dep.options || []
        }
      }
    }
    return modifiedField
  })
})

const isFieldInCurrentStep = (id: string) => Object.keys(currentStep.value.fields).includes(id)

const hasCurrentErrors = computed(() => Object.keys(currentStep.value.fields).some(id => errors.value[id]))

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
  if (stepIndex.value === steps.value.length) {
    props.onSubmit(data)
  }
})
</script>

<template>
  <Stepper v-slot="{ isPrevDisabled, nextStep, prevStep, modelValue }" v-model="stepIndex" class="block w-full">
    <div class="flex w-full flex-start gap-2">
      <StepperItem
        v-for="(step, index) in steps"
        :key="index"
        v-slot="{ state }"
        class="relative flex w-full flex-col items-center justify-center"
        :step="index + 1"
      >
        <StepperSeparator
          v-if="index + 1 !== steps.length"
          class="absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-0.5 shrink-0 rounded-full bg-muted group-data-[state=completed]:bg-primary"
        />

        <StepperTrigger as-child>
          <Button
            :variant="state === 'completed' || state === 'active' ? 'default' : 'outline'"
            size="icon"
            class="z-10 rounded-full shrink-0"
            :class="[state === 'active' && 'ring-2 ring-ring ring-offset-2 ring-offset-background']"
            :disabled="state !== 'completed' && (index >= (modelValue || 0) && hasCurrentErrors)"
          >
            <Check v-if="state === 'completed'" class="size-5" />
            <Circle v-if="state === 'active'" />
            <Dot v-if="state === 'inactive'" />
          </Button>
        </StepperTrigger>

        <div class="mt-5 flex flex-col items-center text-center">
          <StepperTitle
            :class="[state === 'active' && 'text-primary']"
            class="text-sm font-semibold transition lg:text-base"
          >
            {{ step.title || `Step ${index + 1}` }}
          </StepperTitle>
          <StepperDescription
            :class="[state === 'active' && 'text-primary']"
            class="sr-only text-xs text-muted-foreground transition md:not-sr-only lg:text-sm"
          >
            {{ step.description || '' }}
          </StepperDescription>
        </div>
      </StepperItem>
    </div>

    <form @submit="onFormSubmit" class="mt-4">
      <FieldGroup>
        <div :class="isFieldInCurrentStep(field.id) ? '' : 'hidden'" :key="field.id" v-for="field in fields">
          <AutoField
            :config="field"
          />
        </div>
      </FieldGroup>

      <div class="flex items-center justify-between mt-4">
        <Button :disabled="isPrevDisabled" variant="outline" size="sm" @click="prevStep()">
          Back
        </Button>
        <div class="flex items-center gap-3">
          <Button v-if="stepIndex !== steps.length" type="button" :disabled="hasCurrentErrors" size="sm" @click="async () => {
            await validate()
            if (!hasCurrentErrors) {
              nextStep()
            }
          }">
            Next
          </Button>
          <Button
            v-if="stepIndex === steps.length" size="sm" type="submit"
          >
            Submit
          </Button>
        </div>
      </div>
    </form>
  </Stepper>
</template>