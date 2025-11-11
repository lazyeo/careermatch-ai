/**
 * OpenAI Client Configuration
 *
 * Provides a singleton OpenAI client instance for the application.
 * Used for AI-powered features like job matching analysis.
 */

import OpenAI from 'openai';

// Validate API key is configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY is not configured in .env.local');
}

/**
 * Singleton OpenAI client instance
 *
 * @example
 * ```ts
 * import { openai } from '@/lib/openai';
 *
 * const completion = await openai.chat.completions.create({
 *   model: 'gpt-4',
 *   messages: [{ role: 'user', content: 'Hello!' }],
 * });
 * ```
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-development',
});

/**
 * Check if OpenAI is properly configured
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== '';
}

/**
 * OpenAI model configurations for different use cases
 */
export const OPENAI_MODELS = {
  /**
   * GPT-4 Turbo - Best for complex reasoning and analysis
   * Use for: Job matching analysis, SWOT analysis
   */
  GPT4_TURBO: 'gpt-4-turbo-preview' as const,

  /**
   * GPT-4 - Stable version for production
   * Use for: 9-dimension analysis, optimization suggestions
   */
  GPT4: 'gpt-4' as const,

  /**
   * GPT-3.5 Turbo - Fast and cost-effective
   * Use for: Keyword extraction, simple text processing
   */
  GPT35_TURBO: 'gpt-3.5-turbo' as const,
} as const;

/**
 * Default temperature settings for different use cases
 */
export const TEMPERATURE_PRESETS = {
  /**
   * For analytical tasks requiring consistency
   * Use for: Matching scores, dimension analysis
   */
  ANALYTICAL: 0.3,

  /**
   * Balanced creativity and consistency
   * Use for: Suggestions, SWOT analysis
   */
  BALANCED: 0.7,

  /**
   * For creative tasks
   * Use for: Cover letter generation, creative suggestions
   */
  CREATIVE: 1.0,
} as const;

/**
 * Error types for OpenAI API calls
 */
export class OpenAIError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'OpenAIError';
  }
}

/**
 * Helper to handle OpenAI API errors gracefully
 */
export function handleOpenAIError(error: unknown): never {
  if (error instanceof OpenAI.APIError) {
    throw new OpenAIError(
      `OpenAI API Error: ${error.message} (${error.status})`,
      error
    );
  }

  throw new OpenAIError(
    'An unexpected error occurred while calling OpenAI API',
    error
  );
}
