/**
 * Multi-AI Provider Configuration
 *
 * Supports multiple AI providers:
 * - OpenAI (native)
 * - Claude (via Anthropic SDK - official API)
 * - Gemini (via relay)
 * - Codex (via relay)
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

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
  /** For conversational tasks */
  CONVERSATIONAL: 0.7,
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
      apiKey: process.env.AI_RELAY_API_KEY,
      baseURL: process.env.AI_RELAY_BASE_URL || 'https://relay.a-dobe.club',
      models: {
        best: 'claude-sonnet-4-5-thinking',
        balanced: 'claude-sonnet-4-5-thinking',
        fast: 'claude-sonnet-4-5-thinking',
      },
      isConfigured: !!process.env.AI_RELAY_API_KEY,
      displayName: 'Claude Sonnet 4.5 (Relay)',
      icon: '🧠',
    },
    gemini: {
      name: 'Gemini',
      type: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai/',
      models: {
        best: 'gemini-3-flash-preview',
        balanced: 'gemini-3-flash-preview',
        fast: 'gemini-3-flash-preview',
      },
      isConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== ''),
      displayName: 'Gemini Flash 3',
      icon: '',
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
 * Priority: gemini > claude > openai > codex
 */
export function getDefaultProvider(): AIProviderConfig | null {
  // Prioritize Gemini
  const geminiConfig = getProviderConfig('gemini')
  if (geminiConfig.isConfigured) {
    console.log('[AI] Using Gemini as default provider')
    return geminiConfig
  }

  // Fallback order: Claude > OpenAI > Codex
  const claudeConfig = getProviderConfig('claude')
  if (claudeConfig.isConfigured) {
    console.log('[AI] Using Claude as fallback provider')
    return claudeConfig
  }

  const openaiConfig = getProviderConfig('openai')
  if (openaiConfig.isConfigured) {
    console.log('[AI] Using OpenAI as fallback provider')
    return openaiConfig
  }

  const codexConfig = getProviderConfig('codex')
  if (codexConfig.isConfigured) {
    console.log('[AI] Using Codex as fallback provider')
    return codexConfig
  }

  return null
}

/**
 * Create Anthropic client for Claude (via relay)
 */
export function createAnthropicClient(): Anthropic {
  const baseURL = process.env.AI_RELAY_BASE_URL || 'https://relay.a-dobe.club'
  const apiKey = process.env.AI_RELAY_API_KEY || ''

  if (!apiKey) {
    throw new Error('AI_RELAY_API_KEY is not configured. Please add it to your environment variables.')
  }

  console.log(`🧠 Using Claude via relay (${baseURL})`)
  return new Anthropic({
    baseURL,
    apiKey
  })
}

/**
 * Create OpenAI-compatible client for non-Claude providers
 */
export function createAIClient(providerType?: AIProviderType): OpenAI {
  const providers = getAIProviders()
  let provider: AIProviderConfig

  if (providerType) {
    // For Claude, throw an error directing to use createAnthropicClient
    if (providerType === 'claude') {
      throw new Error('For Claude, use createAnthropicClient() instead of createAIClient()')
    }
    provider = providers[providerType]
    if (!provider.isConfigured) {
      throw new Error(`AI Provider "${providerType}" is not configured`)
    }
  } else {
    const defaultProvider = getDefaultProvider()
    if (!defaultProvider) {
      throw new Error('No AI provider is configured. Please add API keys to .env.local')
    }
    // If default is Claude, throw error
    if (defaultProvider.type === 'claude') {
      throw new Error('Default provider is Claude. Use createAnthropicClient() instead.')
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

/**
 * Unified message format for AI calls
 */
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Unified AI completion options
 */
export interface AICompletionOptions {
  model?: string
  messages: AIMessage[]
  temperature?: number
  maxTokens?: number
}

/**
 * Unified AI completion response
 */
export interface AICompletionResponse {
  content: string
  model: string
  provider: AIProviderType
}

/**
 * Create a unified AI completion - automatically handles OpenAI vs Anthropic SDK
 * This is the recommended way to call AI APIs regardless of provider
 */
export async function createAICompletion(
  options: AICompletionOptions,
  providerType?: AIProviderType
): Promise<AICompletionResponse> {
  const defaultProvider = getDefaultProvider()
  const provider = providerType
    ? getProviderConfig(providerType)
    : defaultProvider

  if (!provider || !provider.isConfigured) {
    throw new AIProviderError(
      'No AI provider is configured. Please add API keys to .env.local'
    )
  }

  const model = options.model || provider.models.best
  const temperature = options.temperature ?? TEMPERATURE_PRESETS.BALANCED
  const maxTokens = options.maxTokens || 8192

  // For Claude, use Anthropic SDK
  if (provider.type === 'claude') {
    const client = createAnthropicClient()

    // Anthropic API has different message format:
    // - system message is a separate parameter
    // - only user/assistant roles in messages array
    const systemMessage = options.messages.find((m) => m.role === 'system')
    const nonSystemMessages = options.messages.filter((m) => m.role !== 'system')

    console.log(`🧠 Calling Claude (${model}) via Anthropic SDK...`)

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemMessage?.content,
      messages: nonSystemMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const content = response.content[0]?.type === 'text'
      ? response.content[0].text
      : ''

    return {
      content,
      model,
      provider: 'claude',
    }
  }

  // For other providers, use OpenAI SDK
  const client = new OpenAI({
    apiKey: provider.apiKey || 'dummy-key',
    baseURL: provider.baseURL,
  })

  console.log(`🤖 Calling ${provider.displayName} (${model}) via OpenAI SDK...`)

  const completion = await client.chat.completions.create({
    model,
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature,
    max_tokens: maxTokens,
  })

  const content = completion.choices[0]?.message?.content || ''

  return {
    content,
    model,
    provider: provider.type,
  }
}


// Default model for AI completions
export const DEFAULT_MODEL = 'gemini-3-flash-preview'
