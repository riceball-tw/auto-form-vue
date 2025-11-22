<script setup lang="ts">
import { Field as VeeField } from 'vee-validate'
import { z } from 'zod'
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { FieldConfig } from './types'

const props = defineProps<{
  config: FieldConfig
}>()

const getFieldDescription = (rules: z.ZodTypeAny): string | undefined => {
  return rules.description
}

const description = getFieldDescription(props.config.rules)
</script>

<template>
  <VeeField v-slot="{ field, errors }" :name="config.id">
    <Field :data-invalid="!!errors.length">
      <FieldLabel :for="`auto-field-${config.id}`">
        {{ config.label }}
      </FieldLabel>

      <Input
        v-if="config.as === 'input'"
        :id="`auto-field-${config.id}`"
        :model-value="field.value"
        @update:model-value="field.onChange"
        :aria-invalid="!!errors.length"
        :placeholder="config.placeholder"
      />

      <InputGroup v-else-if="config.as === 'textarea'">
        <InputGroupTextarea
          :id="`auto-field-${config.id}`"
          :model-value="field.value"
          @update:model-value="field.onChange"
          :rows="4"
          class="min-h-24 resize-none"
          :aria-invalid="!!errors.length"
          :placeholder="config.placeholder"
        />
      </InputGroup>

       <Select v-else-if="config.as === 'select'" :model-value="field.value" @update:model-value="field.onChange">
         <SelectTrigger :id="`auto-field-${config.id}`" :aria-invalid="!!errors.length">
           <SelectValue />
         </SelectTrigger>
         <SelectContent>
           <SelectItem v-for="option in config.options" :key="option.value" :value="option.value">
             {{ option.label }}
           </SelectItem>
         </SelectContent>
       </Select>

       <div v-else-if="config.as === 'checkbox'" class="space-y-2">
         <Field
           v-for="option in config.options"
           :key="option.value"
           orientation="horizontal"
           :data-invalid="!!errors.length"
         >
           <Checkbox
             :id="`auto-field-${config.id}-${option.value}`"
             :name="field.name"
             :aria-invalid="!!errors.length"
             :model-value="field.value?.includes(option.value)"
             @update:model-value="
               (checked: boolean | 'indeterminate') => {
                 const newValue = checked
                   ? [...(field.value || []), option.value]
                   : (field.value || []).filter(
                     (value: string) => value !== option.value,
                   );
                 field.onChange(newValue);
               }
             "
           />
           <FieldLabel
             :for="`auto-field-${config.id}-${option.value}`"
             class="font-normal"
           >
             {{ option.label }}
           </FieldLabel>
         </Field>
       </div>

      <FieldDescription v-if="description">
        {{ description }}
      </FieldDescription>

      <FieldError v-if="errors.length" :errors="errors" />
    </Field>
  </VeeField>
</template>