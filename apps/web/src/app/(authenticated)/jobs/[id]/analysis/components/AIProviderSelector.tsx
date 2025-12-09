'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Check } from 'lucide-react'

export type AIProviderType = 'openai' | 'codex' | 'claude' | 'gemini'

interface AIProvider {
  type: AIProviderType
  name: string
  displayName: string
  icon: string
  isAvailable: boolean
  description: string
}

interface AIProviderSelectorProps {
  selectedProvider?: AIProviderType
  onSelect: (provider?: AIProviderType) => void
}

export function AIProviderSelector({ selectedProvider, onSelect }: AIProviderSelectorProps) {
  const t = useTranslations('analysis.aiProvider')
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch available providers from API
    fetch('/api/ai-providers')
      .then((res) => res.json())
      .then((data) => {
        setProviders(data.providers || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching AI providers:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-sm text-gray-500">{t('loading')}</div>
        </CardContent>
      </Card>
    )
  }

  const availableProviders = providers.filter((p) => p.isAvailable)

  if (availableProviders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">{t('noProviders')}</p>
            <p className="text-xs text-gray-500">{t('configureHint')}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If only one provider is available, auto-select it
  if (availableProviders.length === 1 && !selectedProvider) {
    onSelect(availableProviders[0].type)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {/* Auto mode */}
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              !selectedProvider
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">⚡</span>
                  <span className="font-semibold text-gray-900">{t('autoSelect')}</span>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                    {t('recommended')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{t('autoSelectDesc')}</p>
              </div>
              {!selectedProvider && (
                <Check className="w-5 h-5 text-primary-600 flex-shrink-0 ml-2" />
              )}
            </div>
          </button>

          {/* Available providers */}
          {availableProviders.map((provider) => (
            <button
              key={provider.type}
              type="button"
              onClick={() => onSelect(provider.type)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedProvider === provider.type
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{provider.icon}</span>
                    <span className="font-semibold text-gray-900">{provider.displayName}</span>
                  </div>
                  <p className="text-sm text-gray-600">{provider.description}</p>
                </div>
                {selectedProvider === provider.type && (
                  <Check className="w-5 h-5 text-primary-600 flex-shrink-0 ml-2" />
                )}
              </div>
            </button>
          ))}
        </div>

        {availableProviders.length > 1 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">💡 {t('tip')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
