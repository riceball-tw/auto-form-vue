export type FieldType = 'input' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'radio' | 'array'

export interface FieldOption {
    label: string
    value: string
}

export interface BuilderDependency {
    sourceField: string
    type: 'HIDES' | 'SETS_OPTIONS'
    value: string
    options?: FieldOption[]
}

export interface BuilderField {
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
    // For Array type
    children?: BuilderField[]
}

export interface BuilderStep {
    id: string
    title: string
    description: string
    fields: BuilderField[]
}
