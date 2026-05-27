import {
  createAICompletion,
  TEMPERATURE_PRESETS,
  type AIProviderType,
} from '@/lib/ai-providers'

export interface CoverLetterAICompletion {
  content: string
  provider: AIProviderType
  model: string
}

export async function completeCoverLetterPrompt(
  prompt: string
): Promise<CoverLetterAICompletion> {
  const response = await createAICompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature: TEMPERATURE_PRESETS.CREATIVE,
    maxTokens: 2000,
  })

  console.log(
    `[cover-letters] Generated cover letter with ${response.provider}/${response.model}`
  )

  return {
    content: response.content,
    provider: response.provider,
    model: response.model,
  }
}
