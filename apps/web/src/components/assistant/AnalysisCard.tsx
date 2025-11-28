'use client'

/**
 * 分析卡片组件
 *
 * 在对话框中显示分析状态和结果概要
 * 支持：加载中、完成、失败三种状态
 */

import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'

export type AnalysisCardStatus = 'loading' | 'completed' | 'failed'

export interface AnalysisCardData {
  status: AnalysisCardStatus
  jobId: string
  jobTitle?: string
  company?: string
  score?: number
  recommendation?: 'strong' | 'moderate' | 'weak' | 'not_recommended'
  summary?: string
  error?: string
  sessionId?: string
}

interface AnalysisCardProps {
  data: AnalysisCardData
  onNavigate?: () => void
}

export function AnalysisCard({ data, onNavigate }: AnalysisCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (data.status === 'completed' && data.sessionId) {
      // 跳转到分析结果页面
      router.push(`/jobs/${data.jobId}/analysis?sessionId=${data.sessionId}`)
      onNavigate?.()
    } else if (data.status === 'loading') {
      // 加载中也可以跳转，查看流式输出
      router.push(`/jobs/${data.jobId}/analysis`)
      onNavigate?.()
    }
  }

  // 加载中状态
  if (data.status === 'loading') {
    return (
      <div
        onClick={handleClick}
        className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-200 p-4 cursor-pointer hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          {/* 加载动画 */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-primary-100 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            </div>
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-primary-700 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>正在分析中...</span>
            </div>
            {data.jobTitle && (
              <p className="text-sm text-gray-600 truncate mt-1">
                {data.jobTitle} · {data.company}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              点击查看实时分析进度
            </p>
          </div>

          {/* 箭头 */}
          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* 进度条动画 */}
        <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-400 to-accent-400 rounded-full animate-progress" />
        </div>
      </div>
    )
  }

  // 失败状态
  if (data.status === 'failed') {
    return (
      <div className="bg-error-50 rounded-xl border border-error-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-error-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-error-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-error-700">分析失败</p>
            <p className="text-sm text-error-600 mt-0.5">
              {data.error || '请稍后重试'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 完成状态
  const { score = 0, recommendation = 'moderate' } = data
  const style = getRecommendationStyle(recommendation)
  const scoreColor = getScoreColor(score)

  return (
    <div
      onClick={handleClick}
      className={`${style.bgColor} rounded-xl border-2 ${style.borderColor} p-4 cursor-pointer hover:shadow-md transition-all group`}
    >
      <div className="flex items-center gap-4">
        {/* 评分圆环 */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-gray-200"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={`${(score / 100) * 176} 176`}
              strokeLinecap="round"
              className={scoreColor}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${scoreColor}`}>{score}</span>
          </div>
        </div>

        {/* 信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 ${style.textColor}`} />
            <span className={`font-semibold ${style.textColor}`}>{style.label}</span>
          </div>
          {data.jobTitle && (
            <p className="text-sm text-gray-700 truncate mt-1">
              {data.jobTitle}
            </p>
          )}
          {data.company && (
            <p className="text-xs text-gray-500 truncate">
              {data.company}
            </p>
          )}
        </div>

        {/* 查看详情 */}
        <div className="flex-shrink-0 flex items-center gap-1 text-sm text-gray-500 group-hover:text-primary-600 transition-colors">
          <span>详情</span>
          <ExternalLink className="w-4 h-4" />
        </div>
      </div>

      {/* 简要说明 */}
      {data.summary && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2">
          {data.summary}
        </p>
      )}
    </div>
  )
}

/**
 * 获取推荐等级样式
 */
function getRecommendationStyle(recommendation: string) {
  switch (recommendation) {
    case 'strong':
      return {
        label: '强烈推荐',
        bgColor: 'bg-success-50',
        textColor: 'text-success-700',
        borderColor: 'border-success-200',
      }
    case 'moderate':
      return {
        label: '值得尝试',
        bgColor: 'bg-primary-50',
        textColor: 'text-primary-700',
        borderColor: 'border-primary-200',
      }
    case 'weak':
      return {
        label: '有一定机会',
        bgColor: 'bg-warning-50',
        textColor: 'text-warning-700',
        borderColor: 'border-warning-200',
      }
    case 'not_recommended':
    default:
      return {
        label: '不建议申请',
        bgColor: 'bg-error-50',
        textColor: 'text-error-700',
        borderColor: 'border-error-200',
      }
  }
}

/**
 * 获取评分颜色
 */
function getScoreColor(score: number): string {
  if (score >= 85) return 'text-success-600'
  if (score >= 65) return 'text-primary-600'
  if (score >= 40) return 'text-warning-600'
  return 'text-error-600'
}

export default AnalysisCard
