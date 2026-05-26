export type AnalysisOutputLocale = 'en' | 'zh'

export function getAnalysisOutputLocale(): AnalysisOutputLocale {
  const configuredLocale = process.env.AI_ANALYSIS_LOCALE || process.env.AI_OUTPUT_LOCALE || 'en'
  return configuredLocale.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}
