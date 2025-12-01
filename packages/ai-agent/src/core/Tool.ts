export interface ToolParameter {
    type: string
    description?: string
    enum?: string[]
}

export interface ToolParameters {
    type: 'object'
    properties: Record<string, ToolParameter>
    required?: string[]
}

export interface Tool {
    name: string
    description: string
    parameters: ToolParameters
    execute: (args: any, context: any) => Promise<any>
}
