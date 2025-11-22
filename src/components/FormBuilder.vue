<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2, GripVertical, Settings, Copy } from 'lucide-vue-next'
import { AutoForm } from '@/components/ui/auto-form'
import { toast } from 'vue-sonner'
import * as z from 'zod'
import { VueDraggable } from 'vue-draggable-plus'
import { faker } from '@faker-js/faker'

// Types for our builder state
type FieldType = 'input' | 'textarea' | 'select' | 'checkbox' | 'switch'

interface FieldOption {
  label: string
  value: string
}

interface BuilderDependency {
  sourceField: string
  type: 'HIDES' | 'SETS_OPTIONS'
  value: string
  options?: FieldOption[]
}

interface BuilderField {
  id: string
  label: string
  key: string // The object key in the schema
  type: FieldType
  placeholder?: string
  required: boolean
  description?: string
  options?: FieldOption[] // For select/checkbox
  // Generic Zod Rule Chain
  zodRules?: string // e.g. ".min(5).email()"
  dependencies?: BuilderDependency[]
}

interface BuilderStep {
  id: string
  title: string
  description: string
  fields: BuilderField[]
}

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
const activeTab = ref('builder') // 'builder' | 'preview' | 'code'

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9)

// Computed: Selected Field
const selectedField = computed(() => {
  if (!selectedFieldId.value) return null
  for (const step of steps.value) {
    const field = step.fields.find(f => f.id === selectedFieldId.value)
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
  const newField: BuilderField = {
    id: generateId(),
    label: `${faker.word.adjective()} ${faker.word.noun()}`,
    key: `field_${generateId()}`,
    type,
    required: true,
    options: type === 'select' || type === 'checkbox' ? [{ label: `${faker.word.noun()}`, value: 'opt1' }] : undefined,
    zodRules: '',
    dependencies: []
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
  steps.value[stepIndex].fields.splice(fieldIndex, 1)
}

const addOption = (field: BuilderField) => {
  if (!field.options) field.options = []
  field.options.push({ label: `${faker.word.noun()}`, value: 'new-opt' })
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
  dep.options.push({ label: 'New Option', value: 'new-opt' })
}

const removeDependencyOption = (dep: BuilderDependency, index: number) => {
  if (dep.options) {
    dep.options.splice(index, 1)
  }
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
      code += `    ${field.key}: {\n`
      code += `      label: '${field.label}',\n`
      code += `      id: '${field.key}',\n`
      code += `      as: '${field.type}' as const,\n`
      
      // Rules generation
      let rules = `z.`
      if (field.type === 'checkbox') {
        rules += `array(z.string())`
      } else if (field.type === 'switch') {
        rules += `boolean()`
      } else {
        rules += `string()`
      }

      // Append user provided rules
      if (field.zodRules) {
        rules += field.zodRules
      }
      
      if (!field.required && field.type !== 'switch' && field.type !== 'checkbox') {
        // Only add optional if it's not already there? 
        // User might have added .optional() manually, but let's keep the checkbox for convenience
        // or maybe we should remove the 'Required' switch if we want full raw control?
        // The user request said "let user enter the rule they want", but "Required" is a very basic one.
        // Let's keep "Required" switch as a high-level toggle that appends .optional() if false.
        rules += `.optional()`
      }
      
       if (field.description) {
         rules += `.describe('${field.description}')`
       }
      
      code += `      rules: ${rules},\n`
      
      if (field.placeholder) {
        code += `      placeholder: '${field.placeholder}',\n`
      }
      
      if (field.options) {
        code += `      options: [\n`
        field.options.forEach(opt => {
          code += `        { label: '${opt.label}', value: '${opt.value}' },\n`
        })
        code += `      ],\n`
      }

      if (field.dependencies && field.dependencies.length > 0) {
        code += `      dependencies: [\n`
        field.dependencies.forEach(dep => {
          code += `        {\n`
          code += `          sourceField: '${dep.sourceField}',\n`
          code += `          type: '${dep.type}',\n`
          
          if (dep.type === 'HIDES') {
             // HIDES means "Hide if true". 
             // If we want "Show if X=Y", we need "Hide if X!=Y".
             // Let's assume the UI says "Hide when source equals value" for simplicity first as per plan.
             code += `          when: (val) => val === '${dep.value}',\n`
          } else if (dep.type === 'SETS_OPTIONS') {
             code += `          when: (sourceVal, targetVal) => sourceVal === '${dep.value}',\n`
             if (dep.options) {
               code += `          options: [\n`
               dep.options.forEach(opt => {
                 code += `            { label: '${opt.label}', value: '${opt.value}' },\n`
               })
               code += `          ],\n`
             }
          }
          code += `        },\n`
        })
        code += `      ],\n`
      }
      
      code += `    },\n`
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
const previewSchema = computed(() => {
  const schemaSteps = steps.value.map(step => {
    const fields: Record<string, any> = {}
    
    step.fields.forEach(field => {
      let zodRule: any
      
      // Base Type
      if (field.type === 'checkbox') {
        zodRule = z.array(z.string())
      } else if (field.type === 'switch') {
        zodRule = z.boolean()
      } else {
        zodRule = z.string()
      }

      // Apply raw rules
      if (field.zodRules) {
        try {
          // Create a function that takes 'z' and the base rule, and returns the modified rule
          // But wait, the user types ".min(5)". We can't easily chain that to an object in eval without the object.
          // Alternative: Construct the full string "z.string().min(5)" and eval that.
          
          let ruleString = ''
          if (field.type === 'checkbox') {
             ruleString = `z.array(z.string())`
          } else if (field.type === 'switch') {
             ruleString = `z.boolean()`
          } else {
             ruleString = `z.string()`
          }
          
          ruleString += field.zodRules
          
          // Safe(r) Eval
          const evalFn = new Function('z', `return ${ruleString}`)
          zodRule = evalFn(z)
          
        } catch (e) {
          console.error(`Invalid Zod rule for field ${field.key}:`, e)
          // Fallback or show error? For now just ignore invalid rules in preview
        }
      }
      
      if (!field.required && field.type !== 'switch' && field.type !== 'checkbox') {
        zodRule = zodRule.optional()
      }
      
       if (field.description) {
         zodRule = zodRule.describe(field.description)
       }
      
      fields[field.key] = {
        label: field.label,
        id: field.key,
        as: field.type,
        rules: zodRule,
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

</script>

<template>
  <div class="flex flex-col lg:flex-row w-full gap-4 p-4">
    <!-- Left Panel: Toolbox & Structure -->
    <Card class="w-full lg:w-1/4 flex flex-col h-fit">
      <CardHeader>
        <CardTitle>Structure</CardTitle>
        <CardDescription>Manage steps and fields</CardDescription>
      </CardHeader>
      <CardContent class="flex-1 overflow-hidden flex flex-col gap-4">
        <ScrollArea class="flex-1 pr-4">
          <div v-for="(step, sIndex) in steps" :key:="step.id" class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold text-sm">{{ step.title }}</h3>
              <Button variant="ghost" size="icon" @click="removeStep(sIndex)" :disabled="steps.length === 1">
                <Trash2 class="w-4 h-4 text-destructive" />
              </Button>
            </div>
            
            <div class="space-y-2 pl-2 border-l-2 border-muted">
              <VueDraggable 
                v-model="step.fields" 
                :animation="150"
                handle=".drag-handle"
                class="space-y-2"
              >
                <div 
                  v-for="(field, fIndex) in step.fields" 
                  :key="field.id"
                  class="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
                  :class="{ 'bg-muted': selectedFieldId === field.id }"
                  @click="selectedFieldId = field.id"
                >
                  <GripVertical class="w-4 h-4 text-muted-foreground drag-handle cursor-grab active:cursor-grabbing" />
                  <span class="text-sm truncate flex-1">{{ field.label }}</span>
                  <span class="text-xs text-muted-foreground uppercase">{{ field.type }}</span>
                  <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop="removeField(sIndex, fIndex)">
                    <Trash2 class="w-3 h-3" />
                  </Button>
                </div>
              </VueDraggable>
              
              <div class="grid grid-cols-2 gap-2 mt-2">
                <Button variant="outline" size="sm" @click="addField(sIndex, 'input')">+ Input</Button>
                <Button variant="outline" size="sm" @click="addField(sIndex, 'select')">+ Select</Button>
                <Button variant="outline" size="sm" @click="addField(sIndex, 'checkbox')">+ Checkbox</Button>
                <Button variant="outline" size="sm" @click="addField(sIndex, 'switch')">+ Switch</Button>
                <Button variant="outline" size="sm" @click="addField(sIndex, 'textarea')">+ Textarea</Button>
              </div>
            </div>
          </div>
          
          <Button class="w-full mt-4" variant="secondary" @click="addStep">
            <Plus class="w-4 h-4 mr-2" /> Add Step
          </Button>
        </ScrollArea>
      </CardContent>
    </Card>

    <!-- Center Panel: Preview / Canvas -->
    <Card class="flex-1 flex flex-col h-fit">
      <Tabs v-model="activeTab" class="flex-1 flex flex-col">
        <div class="p-4 border-b flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="preview">Live Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="builder" class="flex-1 p-8 bg-muted/20 overflow-auto">
          <div class="max-w-2xl mx-auto space-y-8">
            <div v-for="step in steps" :key="step.id" class="bg-card border rounded-lg p-6 shadow-sm">
              <div class="mb-6">
                <Input v-model="step.title" class="text-lg font-semibold border-none px-0 h-auto focus-visible:ring-0" placeholder="Step Title" />
                <Input v-model="step.description" class="text-sm text-muted-foreground border-none px-0 h-auto focus-visible:ring-0" placeholder="Step Description" />
              </div>
              
              <div class="space-y-4">
                <div v-for="field in step.fields" :key="field.id" class="p-4 border rounded-md bg-background relative group">
                  <div class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button variant="ghost" size="icon" @click="selectedFieldId = field.id"><Settings class="w-4 h-4" /></Button>
                  </div>
                  <Label>{{ field.label }}</Label>
                  <div class="mt-2 pointer-events-none opacity-60">
                    <Input v-if="field.type === 'input'" :placeholder="field.placeholder" />
                    <Textarea v-else-if="field.type === 'textarea'" :placeholder="field.placeholder" />
                    <Select v-else-if="field.type === 'select'">
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    </Select>
                    <div v-else-if="field.type === 'switch'" class="flex items-center space-x-2">
                      <Switch />
                    </div>
                    <div v-else-if="field.type === 'checkbox'" class="space-y-2">
                      <div v-for="opt in field.options || []" :key="opt.value" class="flex items-center space-x-2">
                        <div class="h-4 w-4 border rounded" />
                        <span>{{ opt.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="step.fields.length === 0" class="text-center py-8 text-muted-foreground border-dashed border-2 rounded-lg">
                  No fields in this step
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" class="flex-1 p-8 overflow-auto">
          <div class="max-w-2xl mx-auto">
            <AutoForm
              :schema="previewSchema"
              :on-submit="(data) => {
                toast('Form submitted:', {
                  description: h('pre', { class: 'bg-code text-code-foreground mt-2 w-[320px] overflow-x-auto rounded-md p-4' }, h('code', JSON.stringify(data, null, 2))),
                })
              }"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="code" class="flex-1 p-4 overflow-hidden min-h-[300px] flex flex-col">
          <div class="flex justify-end mb-2">
            <Button variant="outline" size="sm" @click="copyCode">
              <Copy class="w-4 h-4 mr-2" />
              Copy Code
            </Button>
          </div>
          <ScrollArea class="flex-1">
            <pre class="text-sm font-mono">{{ generatedCode }}</pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>

    <!-- Right Panel: Properties -->
    <Card class="w-full lg:w-1/4 flex flex-col h-fit">
      <CardHeader>
        <CardTitle>Properties</CardTitle>
        <CardDescription v-if="selectedField">Edit {{ selectedField.label }}</CardDescription>
        <CardDescription v-else>Select a field to edit</CardDescription>
      </CardHeader>
      <CardContent class="flex-1 overflow-auto">
        <div v-if="selectedField" class="space-y-4">
          <div class="space-y-2">
            <Label>Label</Label>
            <Input v-model="selectedField.label" />
          </div>
          
          <div class="space-y-2">
            <Label>Key (ID)</Label>
            <Input v-model="selectedField.key" />
          </div>
          
          <div class="space-y-2">
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
          
          <div class="space-y-2">
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
                        <Input v-model="opt.label" placeholder="Label" class="h-7 text-xs flex-1" />
                        <Input v-model="opt.value" placeholder="Value" class="h-7 text-xs flex-1" />
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
          Click on a field in the structure or canvas to edit its properties.
        </div>
      </CardContent>
    </Card>
  </div>
</template>
