import { NextResponse } from 'next/server'
import { getAvailableProviders, getDefaultProvider } from '@/lib/ai-providers'

/**
 * GET /api/ai-providers
 *
 * Returns list of configured AI providers
 */
export async function GET() {
  try {
    const availableProviders = getAvailableProviders()
    const defaultProvider = getDefaultProvider()

    // Add descriptions for UI
    const providersWithDescriptions = availableProviders.map((provider) => {
      let description = ''

      switch (provider.type) {
        case 'openai':
          description = '原生OpenAI API，稳定可靠，适合生产环境'
          break
        case 'codex':
          description = 'OpenAI Codex通过中继服务，适合代码相关分析'
          break
        case 'claude':
          description = 'Claude AI通过中继服务，卓越的推理能力，推荐用于岗位匹配分析'
          break
        case 'gemini':
          description = 'Google Gemini通过中继服务，快速高效'
          break
      }

      return {
        ...provider,
        description,
        isAvailable: provider.isConfigured,
      }
    })

    return NextResponse.json({
      providers: providersWithDescriptions,
      default: defaultProvider?.type,
      count: availableProviders.length,
    })
  } catch (error) {
    console.error('Error getting AI providers:', error)
    return NextResponse.json(
      { error: 'Failed to get AI providers' },
      { status: 500 }
    )
  }
}
