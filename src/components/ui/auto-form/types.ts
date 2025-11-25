import * as z from 'zod'

export type DependencyType = 'HIDES' | 'SETS_OPTIONS'

export type Dependency =
  | {
    sourceField: string
    type: 'HIDES'
    when: (sourceValue: any) => boolean
  }
  | {
    sourceField: string
    type: 'SETS_OPTIONS'
    when: (sourceValue: any, targetValue: any) => boolean
    options: { label: string; value: string }[]
  }

export type FieldConfig =
  | {
    label: string
    id: string
    as: 'input'
    rules: z.ZodTypeAny
    placeholder?: string
    dependencies?: Dependency[]
  }
  | {
    label: string
    id: string
    as: 'textarea'
    rules: z.ZodTypeAny
    placeholder?: string
    dependencies?: Dependency[]
  }
  | {
    label: string
    id: string
    as: 'select'
    rules: z.ZodTypeAny
    options: { label: string; value: string }[]
    dependencies?: Dependency[]
  }
  | {
    label: string
    id: string
    as: 'checkbox'
    rules: z.ZodTypeAny
    options: { label: string; value: string }[]
    dependencies?: Dependency[]
  }
  | {
    label: string
    id: string
    as: 'switch'
    rules: z.ZodTypeAny
    dependencies?: Dependency[]
  }
  | {
    label: string
    id: string
    as: 'radio'
    rules: z.ZodTypeAny
    options: { label: string; value: string }[]
    dependencies?: Dependency[]
  }
  | {
    label: string
    id: string
    as: 'date'
    rules: z.ZodTypeAny
    placeholder?: string
    dependencies?: Dependency[]
  }
  | {
    label: string
    id: string
    as: 'array'
    rules: z.ZodTypeAny
    schema: Record<string, FieldConfig>
    dependencies?: Dependency[]
  }
  | {
    label: string;
    id: string;
    as: 'range-date';
    rules: z.ZodTypeAny;
    placeholder?: string;
    dependencies?: Dependency[];
  }

// Utility type to infer form data from schema
export type InferFormData = Record<string, any>