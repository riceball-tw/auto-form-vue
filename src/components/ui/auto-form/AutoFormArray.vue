<script setup lang="ts">
import { useFieldArray } from 'vee-validate'
import type { FieldConfig } from './types'
import AutoField from './AutoField.vue'
import AutoFormArray from './AutoFormArray.vue'
import { Button } from '@/components/ui/button'
import { Plus, Trash } from 'lucide-vue-next'

const props = defineProps<{
  config: FieldConfig & { as: 'array' }
}>()

const { fields, remove, push } = useFieldArray(props.config.id)

const getBoundFieldConfig = (originalConfig: FieldConfig, index: number): FieldConfig => {
  return {
    ...originalConfig,
    id: `${props.config.id}[${index}].${originalConfig.id}`
  }
}
</script>

<template>
  <div class="space-y-4">
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
             <AutoFormArray v-if="subFieldConfig.as === 'array'" :config="getBoundFieldConfig(subFieldConfig, index) as any" />
             <AutoField v-else :config="getBoundFieldConfig(subFieldConfig, index)" />
          </template>
       </div>
    </div>

    <Button type="button" variant="outline" @click="push({})" class="w-full">
      <Plus class="mr-2 size-4" />
      Add {{ config.label }}
    </Button>
  </div>
</template>
