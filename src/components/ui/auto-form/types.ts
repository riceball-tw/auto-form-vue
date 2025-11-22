import type { z } from 'zod'

export type FieldConfig =
  | {
      label: string
      id: string
      as: 'input'
      rules: z.ZodTypeAny
      placeholder?: string
    }
  | {
      label: string
      id: string
      as: 'textarea'
      rules: z.ZodTypeAny
      placeholder?: string
    }
  | {
      label: string
      id: string
      as: 'select'
      rules: z.ZodTypeAny
      options: { label: string; value: string }[]
    }
  | {
      label: string
      id: string
      as: 'checkbox'
      rules: z.ZodTypeAny
      options: { label: string; value: string }[]
    }
  | {
      label: string
      id: string
      as: 'switch'
      rules: z.ZodTypeAny
    }

// Utility type to infer form data from schema
export type InferFormData<T extends { fields: Record<string, FieldConfig> }> = {
  [K in keyof T['fields']]: z.infer<T['fields'][K]['rules']>
}