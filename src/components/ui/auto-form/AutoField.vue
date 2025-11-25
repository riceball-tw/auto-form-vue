<script setup lang="ts">
import { computed } from 'vue'
import { Field as VeeField } from 'vee-validate'
import { z } from 'zod'
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DateFormatter, type DateValue, getLocalTimeZone, fromDate } from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'
import type { FieldConfig } from './types'
import { RangeCalendar } from '@/components/ui/range-calendar'
import Range from '@/components/ui/range/Range.vue'

const props = defineProps<{
  config: FieldConfig
}>()

const getFieldDescription = (rules: z.ZodTypeAny): string | undefined => {
  return rules.description
}

const description = computed(() => getFieldDescription(props.config.rules))
</script>

<template>
  <VeeField v-slot="{ field, errors }" :name="config.id">
    <Field :data-invalid="!!errors.length" :data-field-key="config.id">
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

       <div v-else-if="config.as === 'checkbox'" class="space-y-2" :data-field-key="config.id">
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

        <div v-else-if="config.as === 'switch'" :data-field-key="config.id">
          <Switch
            :id="`auto-field-${config.id}`"
            :model-value="field.value"
            @update:model-value="field.onChange"
            :aria-invalid="!!errors.length"
          />
        </div>

        <div v-else-if="config.as === 'radio'" :data-field-key="config.id">
          <RadioGroup
            :id="`auto-field-${config.id}`"
            :model-value="field.value"
            @update:model-value="field.onChange"
            :aria-invalid="!!errors.length"
          >
            <div v-for="option in config.options" :key="option.value" class="flex items-center space-x-2">
              <RadioGroupItem :id="`auto-field-${config.id}-${option.value}`" :value="option.value" />
              <Label :for="`auto-field-${config.id}-${option.value}`">{{ option.label }}</Label>
            </div>
          </RadioGroup>
        </div>

        <div v-else-if="config.as === 'date'" :data-field-key="config.id">
          <Popover>
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                :class="cn(
                  'w-full justify-start text-left font-normal',
                  !field.value && 'text-muted-foreground',
                )"
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {{ field.value ? new DateFormatter('en-US', { dateStyle: 'long' }).format(new Date(field.value)) : (config.placeholder || "Pick a date") }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-auto p-0">
              <Calendar
                :model-value="field.value ? fromDate(new Date(field.value), getLocalTimeZone()) : undefined"
                @update:model-value="(v: DateValue | undefined) => {
                  field.onChange(v ? v.toDate(getLocalTimeZone()) : undefined)
                }"
                initial-focus
              />
            </PopoverContent>
          </Popover>
        </div>

      <div v-else-if="config.as === 'range-date'" :data-field-key="config.id">
        <Popover>
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              :class="cn(
                'w-full justify-start text-left font-normal',
                !field.value && 'text-muted-foreground',
              )">
              <CalendarIcon class="mr-2 h-4 w-4" />
              <template v-if="field.value?.start">
                <template v-if="field.value.end">
                  {{ new DateFormatter('en-us', { dateStyle: 'medium' }).format(new Date(field.value.start)) }} ~ {{ new DateFormatter('en-us', { dateStyle: 'medium' }).format(new Date(field.value.end)) }}
                </template>
                <template v-else>
                  {{ new DateFormatter('en-us', { dateStyle: 'medium' }).format(new Date(field.value.start)) }}
                </template>
              </template>
              <template v-else>
                {{ config.placeholder || "Pick a date range" }}
              </template>
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <RangeCalendar
              :number-of-months="2"
              :model-value="field.value ? {
                start: field.value.start ? fromDate(new Date(field.value.start), getLocalTimeZone()) : undefined,
                end: field.value.end ? fromDate(new Date(field.value.end), getLocalTimeZone()) : undefined
              } : undefined"
              @update:model-value="(v: any) => {
                if (v) {
                  field.onChange({
                    start: v.start ? v.start.toDate(getLocalTimeZone()) : undefined,
                    end: v.end ? v.end.toDate(getLocalTimeZone()) : undefined
                  })
                } else {
                  field.onChange(undefined)
                }
              }"
              initial-focus/>
          </PopoverContent>
        </Popover>
      </div>
 
      <div v-else-if="config.as === 'range'" :data-field-key="config.id">
        <Range
          :model-value="field.value"
          :min="config.min"
          :max="config.max"
          :step="config.step"
          :placeholder="config.placeholder"
          @update:model-value="field.onChange"/>
      </div>
       
       <FieldDescription v-if="description">
        {{ description }}
      </FieldDescription>

      <FieldError v-if="errors.length" :errors="errors" />
    </Field>
  </VeeField>
</template>