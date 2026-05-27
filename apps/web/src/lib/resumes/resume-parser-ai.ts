import { parseResumeContent } from '@careermatch/resume-parser'
import type { ParsedResumeData } from '@careermatch/shared'

import {
  createAICompletion,
  TEMPERATURE_PRESETS,
  type AIProviderType,
} from '@/lib/ai-providers'

export interface ParsedResumeWithAI {
  parsedData: ParsedResumeData
  provider: AIProviderType
  model: string
}

export async function parseResumeWithAI(content: string): Promise<ParsedResumeWithAI> {
  let provider: AIProviderType = 'openai'
  let model = 'unknown'

  const parsedData = await parseResumeContent(content, {
    aiComplete: async (prompt) => {
      const response = await createAICompletion({
        messages: [{ role: 'user', content: prompt }],
        temperature: TEMPERATURE_PRESETS.ANALYTICAL,
        maxTokens: 8000,
      })

      provider = response.provider
      model = response.model

      console.log(`[resumes] Parsed resume with ${provider}/${model}`)

      return response.content
    },
  })

  return { parsedData, provider, model }
}
