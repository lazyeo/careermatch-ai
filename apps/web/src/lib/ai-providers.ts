/**
 * Multi-AI Provider Configuration
 *
 * Supports multiple AI providers through relay service:
 * - OpenAI (native)
 * - OpenAI Codex (via relay)
 * - Claude (via relay)
 * - Gemini (via relay)
 *
 * Based on claude-relay-service: https://github.com/Wei-Shaw/claude-relay-service
 */

import OpenAI from 'openai'

/**
 * AI Provider Types
 */
export type AIProviderType = 'openai' | 'codex' | 'claude' | 'gemini'

/**
 * AI Provider Configuration
 */
export interface AIProviderConfig {
  name: string
  type: AIProviderType
  apiKey?: string
  baseURL?: string
  models: {
    /** Best model for complex reasoning */
    best: string
    /** Balanced model for most tasks */
    balanced: string
    /** Fast model for simple tasks */
    fast: string
  }
  /** Whether this provider is configured and ready to use */
  isConfigured: boolean
  /** Display name for UI */
  displayName: string
  /** Icon emoji for UI */
  icon: string
}

/**
 * Temperature presets for different use cases
 */
export const TEMPERATURE_PRESETS = {
  /** For analytical tasks requiring consistency */
  ANALYTICAL: 0.3,
  /** Balanced creativity and consistency */
  BALANCED: 0.7,
  /** For creative tasks */
  CREATIVE: 1.0,
} as const

/**
 * Get all AI provider configurations
 */
export function getAIProviders(): Record<AIProviderType, AIProviderConfig> {
  return {
    openai: {
      name: 'OpenAI',
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      models: {
        best: 'gpt-4-turbo-preview',
        balanced: 'gpt-4',
        fast: 'gpt-3.5-turbo',
      },
      isConfigured: !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== ''),
      displayName: 'OpenAI GPT-4',
      icon: '🤖',
    },
    codex: {
      name: 'Codex',
      type: 'codex',
      apiKey: process.env.CODEX_API_KEY,
      baseURL: process.env.CODEX_BASE_URL,
      models: {
        best: 'gpt-4-turbo-preview',
        balanced: 'gpt-4',
        fast: 'gpt-3.5-turbo',
      },
      isConfigured: !!(process.env.CODEX_API_KEY && process.env.CODEX_BASE_URL),
      displayName: 'OpenAI Codex (Relay)',
      icon: '🔧',
    },
    claude: {
      name: 'Claude',
      type: 'claude',
      apiKey: process.env.CLAUDE_API_KEY,
      baseURL: process.env.CLAUDE_BASE_URL,
      models: {
        best: 'claude-3-opus-20240229',
        balanced: 'claude-3-sonnet-20240229',
        fast: 'claude-3-haiku-20240307',
      },
      isConfigured: !!(process.env.CLAUDE_API_KEY && process.env.CLAUDE_BASE_URL),
      displayName: 'Claude 3 (Relay)',
      icon: '🧠',
    },
    gemini: {
      name: 'Gemini',
      type: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: process.env.GEMINI_BASE_URL,
      models: {
        best: 'gemini-pro',
        balanced: 'gemini-pro',
        fast: 'gemini-pro',
      },
      isConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_BASE_URL),
      displayName: 'Google Gemini (Relay)',
      icon: '💎',
    },
  }
}

/**
 * Get list of configured (available) providers
 */
export function getAvailableProviders(): AIProviderConfig[] {
  const providers = getAIProviders()
  return Object.values(providers).filter((p) => p.isConfigured)
}

/**
 * Get the default provider to use
 * Priority: claude > openai > codex > gemini
 */
export function getDefaultProvider(): AIProviderConfig | null {
  const available = getAvailableProviders()

  if (available.length === 0) {
    return null
  }

  // Priority order
  const priorityOrder: AIProviderType[] = ['claude', 'openai', 'codex', 'gemini']

  for (const type of priorityOrder) {
    const provider = available.find((p) => p.type === type)
    if (provider) {
      return provider
    }
  }

  return available[0]
}

/**
 * Create OpenAI-compatible client for a specific provider
 */
export function createAIClient(providerType?: AIProviderType): OpenAI {
  const providers = getAIProviders()
  let provider: AIProviderConfig

  if (providerType) {
    provider = providers[providerType]
    if (!provider.isConfigured) {
      throw new Error(`AI Provider "${providerType}" is not configured`)
    }
  } else {
    const defaultProvider = getDefaultProvider()
    if (!defaultProvider) {
      throw new Error('No AI provider is configured. Please add API keys to .env.local')
    }
    provider = defaultProvider
  }

  console.log(`🤖 Using AI Provider: ${provider.displayName}`)

  return new OpenAI({
    apiKey: provider.apiKey || 'dummy-key',
    baseURL: provider.baseURL,
  })
}

/**
 * Get the best model for a specific provider
 */
export function getBestModel(providerType?: AIProviderType): string {
  const providers = getAIProviders()
  let provider: AIProviderConfig

  if (providerType) {
    provider = providers[providerType]
  } else {
    const defaultProvider = getDefaultProvider()
    if (!defaultProvider) {
      throw new Error('No AI provider is configured')
    }
    provider = defaultProvider
  }

  return provider.models.best
}

/**
 * Check if any AI provider is configured
 */
export function isAnyAIConfigured(): boolean {
  return getAvailableProviders().length > 0
}

/**
 * Check if a specific provider is configured
 */
export function isProviderConfigured(providerType: AIProviderType): boolean {
  const providers = getAIProviders()
  return providers[providerType].isConfigured
}

/**
 * Get provider configuration by type
 */
export function getProviderConfig(providerType: AIProviderType): AIProviderConfig {
  const providers = getAIProviders()
  return providers[providerType]
}

/**
 * Error class for AI provider errors
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public providerType?: AIProviderType,
    public cause?: unknown
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

/**
 * Handle AI API errors gracefully
 */
export function handleAIError(error: unknown, providerType?: AIProviderType): never {
  if (error instanceof OpenAI.APIError) {
    throw new AIProviderError(
      `AI API Error: ${error.message} (${error.status})`,
      providerType,
      error
    )
  }

  throw new AIProviderError(
    'An unexpected error occurred while calling AI API',
    providerType,
    error
  )
}
