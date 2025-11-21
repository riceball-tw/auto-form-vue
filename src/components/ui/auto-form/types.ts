import type { z } from 'zod'

export interface FieldConfig {
  label: string
  name: string
  as: 'input' | 'textarea'
  rules: z.ZodTypeAny
}

// Utility type to infer form data from schema
export type InferFormData<T extends { fields: Record<string, FieldConfig> }> = {
  [K in keyof T['fields']]: z.infer<T['fields'][K]['rules']>
}