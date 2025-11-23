<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical } from 'lucide-vue-next'
import { faker } from '@faker-js/faker'
import type { BuilderField, FieldType } from './FormBuilderTypes'

const props = defineProps<{
  fields: BuilderField[]
  selectedFieldId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:fields', value: BuilderField[]): void
  (e: 'select', id: string): void
  (e: 'remove', index: number): void
}>()

const localFields = computed({
  get: () => props.fields,
  set: (value) => emit('update:fields', value)
})

const generateId = () => Math.random().toString(36).substring(2, 9)

const addField = (parentField: BuilderField, type: FieldType) => {
  if (!parentField.children) parentField.children = []
  
  const newField: BuilderField = {
    id: generateId(),
    label: `${faker.animal.type()}`,
    key: `field_${generateId()}`,
    type,
    required: true,
    options: type === 'select' || type === 'checkbox' || type === 'radio' ? [{ label: `${faker.animal.type()}`, value: 'option-1' }] : undefined,
    zodRules: '',
    dependencies: [],
    children: []
  }
  
  parentField.children.push(newField)
  emit('select', newField.id)
}

const removeChildField = (parentField: BuilderField, index: number) => {
  if (parentField.children && parentField.children[index]) {
    const field = parentField.children[index]
    if (props.selectedFieldId === field.id) {
      emit('select', '') // Deselect if removing selected
    }
    parentField.children.splice(index, 1)
  }
}

// Pass through events from recursive children
const onSelect = (id: string) => emit('select', id)
</script>

<template>
  <VueDraggable 
    v-model="localFields" 
    :animation="150"
    handle=".drag-handle"
    class="space-y-2 min-h-[10px]"
    group="fields"
  >
    <div 
      v-for="(field, index) in localFields" 
      :key="field.id"
      class="flex flex-col gap-2 p-2 rounded-md border border-transparent hover:border-border transition-colors"
      :class="{ 'bg-muted/50 border-border': selectedFieldId === field.id, 'bg-background border-border': field.type === 'array' }"
      @click.stop="emit('select', field.id)"
    >
      <!-- Field Header -->
      <div class="flex items-center gap-2">
        <GripVertical class="w-4 h-4 text-muted-foreground drag-handle cursor-grab active:cursor-grabbing" />
        <span class="text-sm truncate flex-1 font-medium">{{ field.label }}</span>
        <span class="text-xs text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded">{{ field.type }}</span>
        <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop="emit('remove', index)">
          <Trash2 class="w-3 h-3 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>

       <!-- Array Children -->
       <div v-if="field.type === 'array'" class="pl-4 ml-2 border-l-2 border-muted flex flex-col gap-2 mt-1 @container">
        <div class="text-xs text-muted-foreground mb-1">Array Item Schema</div>
        
        <!-- Recursive List -->
        <FormBuilderFieldList
          v-if="field.children"
          :fields="field.children"
          :selected-field-id="selectedFieldId"
          @update:fields="field.children = $event"
          @select="onSelect"
          @remove="(idx) => removeChildField(field, idx)"
        />

         <!-- Add Child Buttons -->
         <div class="grid gap-2 grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3 mt-2">
           <Button class="justify-start h-7 text-xs" variant="outline" size="sm" @click.stop="addField(field, 'input')"><Plus class="w-3 h-3 mr-1" /> Input</Button>
           <Button class="justify-start h-7 text-xs" variant="outline" size="sm" @click.stop="addField(field, 'select')"><Plus class="w-3 h-3 mr-1" /> Select</Button>
           <Button class="justify-start h-7 text-xs" variant="outline" size="sm" @click.stop="addField(field, 'checkbox')"><Plus class="w-3 h-3 mr-1" /> Check</Button>
           <Button class="justify-start h-7 text-xs" variant="outline" size="sm" @click.stop="addField(field, 'radio')"><Plus class="w-3 h-3 mr-1" /> Radio</Button>
           <Button class="justify-start h-7 text-xs" variant="outline" size="sm" @click.stop="addField(field, 'switch')"><Plus class="w-3 h-3 mr-1" /> Switch</Button>
           <Button class="justify-start h-7 text-xs" variant="outline" size="sm" @click.stop="addField(field, 'textarea')"><Plus class="w-3 h-3 mr-1" /> Text</Button>
           <Button class="justify-start h-7 text-xs" variant="outline" size="sm" @click.stop="addField(field, 'array')"><Plus class="w-3 h-3 mr-1" /> Array</Button>
        </div>
      </div>
    </div>
  </VueDraggable>
</template>
