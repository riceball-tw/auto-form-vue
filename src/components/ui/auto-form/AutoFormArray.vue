<script setup lang="ts">
import { useFieldArray, useFormValues } from 'vee-validate'
import type { FieldConfig, Dependency } from './types'
import AutoField from './AutoField.vue'
import AutoFormArray from './AutoFormArray.vue'
import { Button } from '@/components/ui/button'
import { Plus, Trash } from 'lucide-vue-next'

const props = defineProps<{
  config: FieldConfig & { as: 'array' }
}>()

const { fields, remove, push } = useFieldArray(props.config.id)
const formValues = useFormValues()

const getBoundFieldConfig = (originalConfig: FieldConfig, index: number): FieldConfig => {
  return {
    ...originalConfig,
    id: `${props.config.id}[${index}].${originalConfig.id}`
  }
}

// Helper to access nested values safely
const getNestedValue = (obj: any, path: string) => {
  if (!obj) return undefined
  return path.split('.').reduce((acc, part) => {
    // Handle array indices like "items[0]"
    const arrayMatch = part.match(/(\w+)\[(\d+)\]/)
    if (arrayMatch) {
      return acc?.[arrayMatch[1]]?.[parseInt(arrayMatch[2])]
    }
    return acc?.[part]
  }, obj)
}

const resolveValue = (sourceField: string, index: number) => {
  // 1. Try to find in current array item context (sibling)
  // The sourceField might be just "siblingField"
  // We construct the path: "parentArray[index].siblingField"
  const localPath = `${props.config.id}[${index}].${sourceField}`
  const localValue = getNestedValue(formValues.value, localPath)
  
  if (localValue !== undefined) return localValue

  // 2. Try global context (top-level or absolute path)
  const globalValue = getNestedValue(formValues.value, sourceField)
  return globalValue
}

const shouldShowField = (field: FieldConfig, index: number) => {
  if (!field.dependencies) return true
  
  for (const dep of field.dependencies) {
    if (dep.type === 'HIDES') {
      const sourceValue = resolveValue(dep.sourceField, index)
      if (dep.when(sourceValue)) {
        return false
      }
    }
  }
  return true
}

const getModifiedConfig = (originalConfig: FieldConfig, index: number): FieldConfig => {
  const boundConfig = getBoundFieldConfig(originalConfig, index)
  if (!originalConfig.dependencies) return boundConfig

  let modifiedConfig = { ...boundConfig }
  
  for (const dep of originalConfig.dependencies) {
    if (dep.type === 'SETS_OPTIONS') {
      const sourceValue = resolveValue(dep.sourceField, index)
      const targetValue = getNestedValue(formValues.value, boundConfig.id)
      
      if (dep.when(sourceValue, targetValue)) {
        (modifiedConfig as any).options = dep.options || []
      }
    }
  }
  
  return modifiedConfig
}
</script>

<template>
  <div class="space-y-4" :data-field-key="config.id">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium">{{ config.label }}</h3>
    </div>
    
    <div v-for="(field, index) in fields" :key="field.key" class="border p-4 rounded-md relative group">
       <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button variant="ghost" size="icon" @click="remove(index)">
            <Trash class="size-4 text-destructive" />
          </Button>
       </div>
       
       <div class="grid gap-4">
          <template v-for="(subFieldConfig, key) in config.schema" :key="key">
             <template v-if="shouldShowField(subFieldConfig, index)">
                <AutoFormArray 
                  v-if="subFieldConfig.as === 'array'" 
                  :config="getModifiedConfig(subFieldConfig, index) as any" 
                />
                <AutoField 
                  v-else 
                  :config="getModifiedConfig(subFieldConfig, index)" 
                />
             </template>
          </template>
       </div>
    </div>

    <Button type="button" variant="outline" @click="push({})" class="w-full">
      <Plus class="mr-2 size-4" />
      Add {{ config.label }}
    </Button>
  </div>
</template>
