import {
  createAICompletion,
  TEMPERATURE_PRESETS,
} from '@/lib/ai-providers'

export async function completeJobParsingPrompt(prompt: string): Promise<string> {
  const response = await createAICompletion({
    messages: [{ role: 'user', content: prompt }],
    temperature: TEMPERATURE_PRESETS.ANALYTICAL,
    maxTokens: 16000,
  })

  console.log(
    `[jobs] Parsed job content with ${response.provider}/${response.model}`
  )

  return response.content
}
