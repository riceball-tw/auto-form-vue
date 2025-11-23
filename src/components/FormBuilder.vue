<script setup lang="ts">
import { ref, computed, h, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, GripVertical, Copy } from 'lucide-vue-next'
import { AutoForm } from '@/components/ui/auto-form'
import { toast } from 'vue-sonner'
import * as z from 'zod'
import { VueDraggable } from 'vue-draggable-plus'
import { faker } from '@faker-js/faker'

import type { BuilderStep, BuilderField, FieldType, BuilderDependency } from './FormBuilderTypes'
import FormBuilderFieldList from './FormBuilderFieldList.vue'

// Initial State
const steps = ref<BuilderStep[]>([
  {
    id: 'step-1',
    title: 'Step 1',
    description: 'Description for step 1',
    fields: []
  }
])

const selectedFieldId = ref<string | null>(null)
const activeTab = ref('preview') // 'preview' | 'code'

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

// Recursive search for field
const findFieldRecursive = (fields: BuilderField[], id: string): BuilderField | null => {
  for (const field of fields) {
    if (field.id === id) return field
    if (field.children) {
      const found = findFieldRecursive(field.children, id)
      if (found) return found
    }
  }
  return null
}

// Computed: Selected Field
const selectedField = computed(() => {
  if (!selectedFieldId.value) return null
  for (const step of steps.value) {
    const field = findFieldRecursive(step.fields, selectedFieldId.value)
    if (field) return field
  }
  return null
})

// Actions
const addStep = () => {
  steps.value.push({
    id: generateId(),
    title: `Step ${steps.value.length + 1}`,
    description: 'New step description',
    fields: []
  })
}

const removeStep = (index: number) => {
  steps.value.splice(index, 1)
}

const addField = (stepIndex: number, type: FieldType) => {
  if (!steps.value[stepIndex]) return
  const newField: BuilderField = {
    id: generateId(),
    label: `${faker.animal.type()}`,
    key: `field_${generateId()}`,
    type,
    required: true,
    options: type === 'select' || type === 'checkbox' || type === 'radio' ? [{ label: `${faker.animal.type()}`, value: 'option-1' }] : undefined,
    zodRules: '',
    dependencies: [],
    children: type === 'array' ? [] : undefined
  }
  steps.value[stepIndex].fields.push(newField)
  selectedFieldId.value = newField.id
}

const removeField = (stepIndex: number, fieldIndex: number) => {
  const step = steps.value[stepIndex]
  if (!step) return
  const field = step.fields[fieldIndex]
  if (!field) return
  if (selectedFieldId.value === field.id) {
    selectedFieldId.value = null
  }
  step.fields.splice(fieldIndex, 1)
}

const addOption = (field: BuilderField) => {
  if (!field.options) field.options = []
  field.options.push({ label: `${faker.animal.type()}`, value: `option-${field.options.length + 1}` })
}

const removeOption = (field: BuilderField, index: number) => {
  if (field.options) {
    field.options.splice(index, 1)
  }
}

const addDependency = (field: BuilderField) => {
  if (!field.dependencies) field.dependencies = []
  field.dependencies.push({
    sourceField: '',
    type: 'HIDES',
    value: ''
  })
}

const removeDependency = (field: BuilderField, index: number) => {
  if (field.dependencies) {
    field.dependencies.splice(index, 1)
  }
}

const addDependencyOption = (dep: BuilderDependency) => {
  if (!dep.options) dep.options = []
  dep.options.push({ label: faker.animal.type(), value: `option-${dep.options.length + 1}` })
}

const removeDependencyOption = (dep: BuilderDependency, index: number) => {
  if (dep.options) {
    dep.options.splice(index, 1)
  }
}

// Code Generation Helper
const generateFieldCode = (field: BuilderField, indentLevel: number = 2): string => {
  const indent = '  '.repeat(indentLevel)
  let code = `${indent}${field.key}: {\n`
  code += `${indent}  label: '${field.label}',\n`
  code += `${indent}  id: '${field.key}',\n`
  code += `${indent}  as: '${field.type}' as const,\n`
  
  // Refactored Rule Generation to handle recursion properly
  const getZodRuleString = (f: BuilderField, level: number): string => {
      let r = `z.`
      if (f.type === 'checkbox') r += `array(z.string())`
      else if (f.type === 'switch') r += `boolean()`
      else if (f.type === 'radio') {
          if (f.options && f.options.length > 0) r += `enum([${f.options.map(o => `'${o.value}'`).join(', ')}])`
          else r += `string()`
      }
      else if (f.type === 'array') {
          r += `array(z.object({\n`
          if (f.children) {
              f.children.forEach(child => {
                  r += `${'  '.repeat(level + 1)}${child.key}: ${getZodRuleString(child, level + 1)},\n`
              })
          }
          r += `${'  '.repeat(level)}}))`
      }
      else r += `string()`
      
      if (f.zodRules) r += f.zodRules
      
      if (!f.required && f.type !== 'switch' && f.type !== 'checkbox') {
          r += `.optional()`
      }
      
      if (f.description) {
          r += `.describe('${f.description}')`
      }
      return r
  }

  code += `${indent}  rules: ${getZodRuleString(field, indentLevel + 2)},\n`

  if (field.type === 'array' && field.children) {
      code += `${indent}  schema: {\n`
      field.children.forEach(child => {
          code += generateFieldCode(child, indentLevel + 2)
      })
      code += `${indent}  },\n`
  }
  
  if (field.placeholder) {
    code += `${indent}  placeholder: '${field.placeholder}',\n`
  }
  
  if (field.options) {
    code += `${indent}  options: [\n`
    field.options.forEach(opt => {
      code += `${indent}    { label: '${opt.label}', value: '${opt.value}' },\n`
    })
    code += `${indent}  ],\n`
  }

  if (field.dependencies && field.dependencies.length > 0) {
    code += `${indent}  dependencies: [\n`
    field.dependencies.forEach(dep => {
      code += `${indent}    {\n`
      code += `${indent}      sourceField: '${dep.sourceField}',\n`
      code += `${indent}      type: '${dep.type}',\n`
      
      if (dep.type === 'HIDES') {
         code += `${indent}      when: (val) => val === '${dep.value}',\n`
      } else if (dep.type === 'SETS_OPTIONS') {
         code += `${indent}      when: (sourceVal, targetVal) => sourceVal === '${dep.value}',\n`
         if (dep.options) {
           code += `${indent}      options: [\n`
           dep.options.forEach(opt => {
             code += `${indent}        { label: '${opt.label}', value: '${opt.value}' },\n`
           })
           code += `${indent}      ],\n`
         }
      }
      code += `${indent}    },\n`
    })
    code += `${indent}  ],\n`
  }
  
  code += `${indent}  },\n`
  return code
}

// Code Generation
const generatedCode = computed(() => {
  let code = `import { z } from 'zod'\n\n`
  
  steps.value.forEach((step, index) => {
    code += `const step${index + 1} = {\n`
    code += `  title: '${step.title}',\n`
    code += `  description: '${step.description}',\n`
    code += `  fields: {\n`
    
    step.fields.forEach(field => {
      code += generateFieldCode(field, 2)
    })
    
    code += `  }\n`
    code += `}\n\n`
  })
  
  code += `export const formSchema = {\n`
  code += `  steps: [${steps.value.map((_, i) => `step${i + 1}`).join(', ')}],\n`
  code += `}\n`
  
   return code
 })

 const copyCode = async () => {
   try {
     await navigator.clipboard.writeText(generatedCode.value)
     toast('Code copied to clipboard!')
   } catch (err) {
     toast('Failed to copy code')
   }
 }

// Live Preview Schema Construction
const buildZodRule = (field: BuilderField) => {
    let zodRule: any
      
    // Base Type
    if (field.type === 'checkbox') {
    zodRule = z.array(z.string())
    } else if (field.type === 'switch') {
    zodRule = z.boolean()
    } else if (field.type === 'radio') {
    const values = field.options?.map(o => o.value)
    if (values && values.length > 0) {
        zodRule = z.enum(values as [string, ...string[]])
    } else {
        zodRule = z.string()
    }
    } else if (field.type === 'array') {
        // Recursive Zod Object
        const shape: Record<string, any> = {}
        if (field.children) {
            field.children.forEach(child => {
                shape[child.key] = buildZodRule(child)
            })
        }
        zodRule = z.array(z.object(shape))
    } else {
    zodRule = z.string()
    }

    // Apply raw rules
    if (field.zodRules) {
    try {
        let ruleString = ''
        if (field.type === 'checkbox') {
            ruleString = `z.array(z.string())`
        } else if (field.type === 'switch') {
            ruleString = `z.boolean()`
        } else if (field.type === 'radio') {
            if (field.options && field.options.length > 0) {
            ruleString = `z.enum([${field.options.map(o => `'${o.value}'`).join(', ')}])`
            } else {
            ruleString = `z.string()`
            }
        } else if (field.type === 'array') {
             ruleString = `z.array(z.object({}))`
        } else {
            ruleString = `z.string()`
        }
        
        ruleString += field.zodRules
        
        const evalFn = new Function('z', `return ${ruleString}`)
        
        if (field.type !== 'array') {
            zodRule = evalFn(z)
        } else {
            // For array, we just want to chain methods to the existing zodRule object
            // This is hard to do with eval string without the object.
            // Let's skip raw rules for array in preview for now to avoid breaking it.
        }
        
    } catch (e) {
        console.error(`Invalid Zod rule for field ${field.key}:`, e)
    }
    }
    
    if (!field.required && field.type !== 'switch' && field.type !== 'checkbox') {
    zodRule = zodRule.optional()
    }
    
    if (field.description) {
        zodRule = zodRule.describe(field.description)
    }

    return zodRule
}

const buildFieldConfig = (field: BuilderField): any => {
    const config: any = {
        label: field.label,
        id: field.key,
        as: field.type,
        rules: buildZodRule(field),
        placeholder: field.placeholder,
        options: field.options,
        dependencies: field.dependencies?.map(dep => {
          return {
            sourceField: dep.sourceField,
            type: dep.type,
            when: (val: any, _targetVal: any) => {
              return val === dep.value
            },
            options: dep.options
          }
        })
    }

    if (field.type === 'array' && field.children) {
        const schema: Record<string, any> = {}
        field.children.forEach(child => {
            schema[child.key] = buildFieldConfig(child)
        })
        config.schema = schema
    }

    return config
}

const previewSchema = computed(() => {
  const schemaSteps = steps.value.map(step => {
    const fields: Record<string, any> = {}
    
    step.fields.forEach(field => {
      fields[field.key] = buildFieldConfig(field)
    })
    
    return {
      title: step.title,
      description: step.description,
      fields
    }
  })
  
  return {
    steps: schemaSteps
  }
})

// Highlight logic for Live Preview
const highlightStyle = ref<Record<string, string> | null>(null)
const formContainer = ref<HTMLElement | null>(null)

const updateHighlight = async () => {
  await nextTick() // Wait for DOM update
  
  if (!selectedFieldId.value || !selectedField.value || activeTab.value !== 'preview' || !formContainer.value) {
    highlightStyle.value = null
    return
  }
  
  // Use data-field-key selector with ends-with matcher to handle nested fields
  const selector = `[data-field-key$="${selectedField.value.key}"]`
  const fieldEl = document.querySelector(selector) as HTMLElement
  
  if (fieldEl && formContainer.value) {
    const containerRect = formContainer.value.getBoundingClientRect()
    const fieldRect = fieldEl.getBoundingClientRect()
    
    // Calculate relative position
    const top = fieldRect.top - containerRect.top
    const left = fieldRect.left - containerRect.left
    
    highlightStyle.value = {
      top: `${top - 8}px`, // -8px padding
      left: `${left - 8}px`,
      width: `${fieldRect.width + 16}px`, // +16px total padding
      height: `${fieldRect.height + 16}px`,
    }
  } else {
    highlightStyle.value = null
  }
}

watch([selectedFieldId, activeTab, previewSchema], () => {
  updateHighlight()
}, { flush: 'post', deep: true })

// Update on resize
onMounted(() => {
  window.addEventListener('resize', updateHighlight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateHighlight)
})

</script>

<template>
  <div class="flex flex-col lg:flex-row w-full gap-4 p-4">
    <!-- Left Panel: Form -->
    <Card class="w-full lg:w-1/4 flex flex-col h-fit @container/form">
      <CardHeader>
        <CardTitle>Form</CardTitle>
        <CardDescription>Manage steps and fields</CardDescription>
      </CardHeader>
      <CardContent class="flex-1 overflow-hidden flex flex-col gap-4">
        <ScrollArea class="flex-1 pr-4">

          <VueDraggable
            v-model="steps"
            :animation="150"
            handle=".step-drag-handle"
            class="flex flex-col gap-4"
          >
            <div v-for="(step, sIndex) in steps" :key="step.id" class="mb-6">
              <div class="flex flex-col gap-2 mb-2">
                <div class="flex items-center justify-between">
                  <GripVertical class="w-4 h-4 text-muted-foreground step-drag-handle cursor-grab active:cursor-grabbing mr-2" />
                  <Input v-model="step.title" class="font-semibold text-sm flex-1" placeholder="Step Title" />
                  <Button variant="ghost" size="icon" @click="removeStep(sIndex)" :disabled="steps.length === 1" class="ml-2">
                    <Trash2 class="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              
              <div class="flex flex-col gap-2 pl-8 border-l-2 border-muted ml-2">
                <Input v-model="step.description" class="mb-0 text-xs text-muted-foreground" placeholder="Step Description" />

                <!-- Recursive Field List -->
                <FormBuilderFieldList
                  :fields="step.fields"
                  :selected-field-id="selectedFieldId"
                  @update:fields="step.fields = $event"
                  @select="(id) => selectedFieldId = id"
                  @remove="(fIndex) => removeField(sIndex, fIndex)"
                />
                
                <div class="grid gap-2 @xs/form:grid-cols-2 mt-2">
                  <Button class=" justify-start" variant="outline" size="sm" @click="addField(sIndex, 'input')"><Plus /> Input</Button>
                  <Button class=" justify-start" variant="outline" size="sm" @click="addField(sIndex, 'select')"><Plus /> Select</Button>
                  <Button class=" justify-start" variant="outline" size="sm" @click="addField(sIndex, 'checkbox')"><Plus /> Checkbox</Button>
                  <Button class=" justify-start" variant="outline" size="sm" @click="addField(sIndex, 'radio')"><Plus /> Radio</Button>
                  <Button class=" justify-start" variant="outline" size="sm" @click="addField(sIndex, 'switch')"><Plus /> Switch</Button>
                  <Button class=" justify-start" variant="outline" size="sm" @click="addField(sIndex, 'textarea')"><Plus /> Textarea</Button>
                  <Button class=" justify-start" variant="outline" size="sm" @click="addField(sIndex, 'array')"><Plus /> Array</Button>
                </div>
              </div>
            </div>
          </VueDraggable>
          
          <Button class="w-full mt-4 flex" variant="secondary" @click="addStep">
            <Plus class="w-4 h-4 mr-2" /> Add Step
          </Button>
        </ScrollArea>
      </CardContent>
    </Card>

    <!-- Center Panel: Preview / Canvas -->
    <Tabs class="flex-1 flex flex-col h-fit" v-model="activeTab">
        <div class="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </div>
      <Card class="p-0">
        <div class="flex-1 flex flex-col w-full">
          <TabsContent value="preview" class="flex-1 p-8 overflow-auto">
            <div class="max-w-2xl mx-auto relative" ref="formContainer">
              <div 
                v-if="highlightStyle"
                class="absolute bg-muted border border-muted-foreground border-dotted border-2 rounded-md -z-0 transition-all duration-300 ease-out pointer-events-none"
                :style="highlightStyle"
              ></div>
              <div class="relative z-10">
              <AutoForm
                :schema="previewSchema"
                :on-submit="(data) => {
                  toast('Form submitted:', {
                    description: h('pre', { class: 'bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4' }, h('code', JSON.stringify(data, null, 2))),
                  })
                }"
              />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="code" class="flex-1 p-2 overflow-hidden flex flex-col">
            <ScrollArea class="flex-1">
              <pre class="text-sm font-mono p-2">{{ generatedCode }}</pre>
            </ScrollArea>
            <div class="flex justify-end">
              <Button variant="outline" class="p-8 w-full" @click="copyCode">
                <Copy class="w-4 h-4 mr-2" />
                Copy Code
              </Button>
            </div>
          </TabsContent>
        </div>
      </Card>
    </Tabs>

    <!-- Right Panel: Properties -->
    <Card class="w-full lg:w-1/4 flex flex-col h-fit">
      <CardHeader>
        <CardTitle>Field Properties</CardTitle>
        <CardDescription v-if="selectedField">Editing: {{ selectedField.label }}</CardDescription>
        <CardDescription v-else>Select a field to edit</CardDescription>
      </CardHeader>
      <CardContent class="flex-1 overflow-auto">
        <div v-if="selectedField" class="space-y-4">
          <div class="space-y-2">
            <Label>Label</Label>
            <Input v-model="selectedField.label" />
          </div>
          
          <div class="space-y-2">
            <Label>ID</Label>
            <Input v-model="selectedField.key" />
          </div>
          
          <div class="space-y-2" v-if="selectedField.type !== 'array'">
            <Label>Placeholder</Label>
            <Input v-model="selectedField.placeholder" />
          </div>
          
          <div class="space-y-2">
            <Label>Description</Label>
            <Input v-model="selectedField.description" />
          </div>
          
          <Separator />
          
          <div class="flex items-center justify-between">
            <Label>Required</Label>
            <Switch v-model="selectedField.required" />
          </div>
          
          <div class="space-y-2" v-if="selectedField.type !== 'array'">
            <Label>Zod Rules</Label>
            <Input v-model="selectedField.zodRules" placeholder=".min(5).max(20)" />
            <p class="text-xs text-muted-foreground">Chain <a href="https://zod.dev/api" class="underline">Zod</a> rules starting with dot.</p>
          </div>
          
          <div v-if="selectedField.options" class="space-y-4">
            <Separator />
            <div class="flex items-center justify-between">
              <Label>Options</Label>
              <Button size="sm" variant="outline" @click="addOption(selectedField)">Add</Button>
            </div>
            <div class="space-y-2">
              <div v-for="(opt, idx) in selectedField.options" :key="idx" class="flex gap-2">
                <Input v-model="opt.label" placeholder="Label" class="flex-1" />
                <Input v-model="opt.value" placeholder="Value" class="flex-1" />
                <Button size="icon" variant="ghost" @click="removeOption(selectedField, idx)">
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <Separator class="my-4" />
          
          <div class="space-y-4">
             <div class="flex items-center justify-between">
              <Label>Dependencies</Label>
              <Button size="sm" variant="outline" @click="addDependency(selectedField)">Add</Button>
            </div>
            
            <div v-if="selectedField.dependencies && selectedField.dependencies.length > 0" class="space-y-4">
              <div v-for="(dep, idx) in selectedField.dependencies" :key="idx" class="border p-3 rounded-md space-y-3 relative">
                 <Button variant="ghost" size="icon" class="absolute right-2 top-2 h-6 w-6" @click="removeDependency(selectedField, idx)">
                    <Trash2 class="w-3 h-3" />
                  </Button>
                  
                  <div class="space-y-1">
                    <Label class="text-xs">Type</Label>
                    <Select v-model="dep.type">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIDES">Hides</SelectItem>
                        <SelectItem value="SETS_OPTIONS">Sets Options</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div class="space-y-1">
                    <Label class="text-xs">Source Field</Label>
                    <Select v-model="dep.sourceField">
                      <SelectTrigger><SelectValue placeholder="Select field" /></SelectTrigger>
                      <SelectContent>
                        <template v-for="step in steps" :key="step.id">
                           <SelectItem 
                              v-for="f in step.fields" 
                              :key="f.key" 
                              :value="f.key"
                              :disabled="f.id === selectedField.id"
                           >
                              {{ f.label }} ({{ f.key }})
                           </SelectItem>
                        </template>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div class="space-y-1">
                    <Label class="text-xs">When Value Equals</Label>
                    <Input v-model="dep.value" placeholder="Value to match" />
                  </div>
                  
                  <div v-if="dep.type === 'SETS_OPTIONS'" class="space-y-2 pt-2 border-t">
                    <div class="flex items-center justify-between">
                      <Label class="text-xs">Target Options</Label>
                      <Button size="icon" variant="ghost" class="h-5 w-5" @click="addDependencyOption(dep)">
                        <Plus class="w-3 h-3" />
                      </Button>
                    </div>
                    <div class="space-y-2">
                      <div v-for="(opt, optIdx) in dep.options || []" :key="optIdx" class="flex gap-2">
                        <Input v-model="opt.label" placeholder="Label" class="text-xs flex-1" />
                        <Input v-model="opt.value" placeholder="Value" class="text-xs flex-1" />
                        <Button size="icon" variant="ghost" class="h-7 w-7" @click="removeDependencyOption(dep, optIdx)">
                          <Trash2 class="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
              </div>
            </div>
            <div v-else class="text-xs text-muted-foreground text-center py-2">
              No dependencies configured.
            </div>
          </div>
          
        </div>
        <div v-else class="text-center text-muted-foreground mt-10">
          Click on a field in the form to edit its properties.
        </div>
      </CardContent>
    </Card>
  </div>
</template>
