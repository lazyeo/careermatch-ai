'use client'

import { useTranslations } from 'next-intl'
import type { AnalysisRecommendation } from '@careermatch/shared'

interface ScoreCardProps {
  score: number
  recommendation: AnalysisRecommendation
}

/**
 * 匹配度评分卡片 - 展示AI分析的总体评分
 */
export function ScoreCard({ score, recommendation }: ScoreCardProps) {
  const t = useTranslations('analysis.scoreCard')
  const { bgColor, textColor, borderColor } = getRecommendationStyle(recommendation)
  const scoreColor = getScoreColor(score)

  return (
    <div className={`rounded-xl border-2 ${borderColor} ${bgColor} p-6`}>
      <div className="flex items-center justify-between">
        {/* 评分 */}
        <div className="flex items-center gap-4">
          <div className={`text-5xl font-bold ${scoreColor}`}>
            {score}
          </div>
          <div className="text-gray-500 text-lg">/100</div>
        </div>

        {/* 推荐等级 */}
        <div className="text-right">
          <div className={`text-xl font-semibold ${textColor}`}>
            {t(`recommendation.${recommendation}.label` as Parameters<typeof t>[0])}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {t(`recommendation.${recommendation}.description` as Parameters<typeof t>[0])}
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(score)}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* 等级说明 */}
      <div className="mt-4 flex justify-between text-xs text-gray-400">
        <span>{t('scale.notRecommended')}</span>
        <span>{t('scale.hasChance')}</span>
        <span>{t('scale.worthTrying')}</span>
        <span>{t('scale.stronglyRecommended')}</span>
      </div>
    </div>
  )
}

/**
 * 获取推荐等级的样式
 */
function getRecommendationStyle(recommendation: AnalysisRecommendation) {
  switch (recommendation) {
    case 'strong':
      return {
        bgColor: 'bg-success-50',
        textColor: 'text-success-700',
        borderColor: 'border-success-200',
      }
    case 'moderate':
      return {
        bgColor: 'bg-primary-50',
        textColor: 'text-primary-700',
        borderColor: 'border-primary-200',
      }
    case 'weak':
      return {
        bgColor: 'bg-warning-50',
        textColor: 'text-warning-700',
        borderColor: 'border-warning-200',
      }
    case 'not_recommended':
    default:
      return {
        bgColor: 'bg-error-50',
        textColor: 'text-error-700',
        borderColor: 'border-error-200',
      }
  }
}

/**
 * 获取评分数字的颜色
 */
function getScoreColor(score: number): string {
  if (score >= 85) return 'text-success-600'
  if (score >= 65) return 'text-primary-600'
  if (score >= 40) return 'text-warning-600'
  return 'text-error-600'
}

/**
 * 获取进度条的颜色
 */
function getProgressColor(score: number): string {
  if (score >= 85) return 'bg-success-500'
  if (score >= 65) return 'bg-primary-500'
  if (score >= 40) return 'bg-warning-500'
  return 'bg-error-500'
}

export default ScoreCard
