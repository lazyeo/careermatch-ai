'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@careermatch/ui'
import {
  Target,
  ListChecks,
  Tags,
  ClipboardCheck,
  TrendingUp,
  FileEdit,
  MessageSquare,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb,
  Shield,
  Zap,
  AlertTriangle,
} from 'lucide-react'
import type { AnalysisDimensions } from '@careermatch/shared'

interface DimensionsDisplayProps {
  dimensions: AnalysisDimensions
}

/**
 * 8维度分析结果展示组件
 * 将AI分析的8个维度以交互式卡片形式展示
 */
export function DimensionsDisplay({ dimensions }: DimensionsDisplayProps) {
  const t = useTranslations('analysis.dimensions')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['matchScore', 'cvStrategy'])
  )

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* 1. 匹配度评分 - 总览 */}
      <ScoreSummaryCard
        matchScore={dimensions.matchScore}
        expanded={expandedSections.has('matchScore')}
        onToggle={() => toggleSection('matchScore')}
        t={t}
      />

      {/* 2. CV策略 - 核心 */}
      <CVStrategyCard
        cvStrategy={dimensions.cvStrategy}
        expanded={expandedSections.has('cvStrategy')}
        onToggle={() => toggleSection('cvStrategy')}
        t={t}
      />

      {/* 3. SWOT分析 */}
      <SWOTCard
        swot={dimensions.swotAnalysis}
        expanded={expandedSections.has('swot')}
        onToggle={() => toggleSection('swot')}
        t={t}
      />

      {/* 4. 关键词匹配 */}
      <KeywordsCard
        keywords={dimensions.keywordMatching}
        expanded={expandedSections.has('keywords')}
        onToggle={() => toggleSection('keywords')}
        t={t}
      />

      {/* 5. 关键要求 */}
      <RequirementsCard
        requirements={dimensions.keyRequirements}
        expanded={expandedSections.has('requirements')}
        onToggle={() => toggleSection('requirements')}
        t={t}
      />

      {/* 6. 面试准备 */}
      <InterviewPrepCard
        interviewPrep={dimensions.interviewPreparation}
        expanded={expandedSections.has('interview')}
        onToggle={() => toggleSection('interview')}
        t={t}
      />

      {/* 7. 角色定位 */}
      <RolePositioningCard
        positioning={dimensions.rolePositioning}
        expanded={expandedSections.has('role')}
        onToggle={() => toggleSection('role')}
        t={t}
      />

      {/* 8. 核心职责 */}
      <ResponsibilitiesCard
        responsibilities={dimensions.coreResponsibilities}
        expanded={expandedSections.has('responsibilities')}
        onToggle={() => toggleSection('responsibilities')}
        t={t}
      />
    </div>
  )
}

// =====================================================
// 子组件
// =====================================================

interface CollapsibleCardProps {
  title: string
  icon: JSX.Element
  expanded: boolean
  onToggle: () => void
  badge?: JSX.Element
  children: ReactNode
}

function CollapsibleCard({
  title,
  icon,
  expanded,
  onToggle,
  badge,
  children,
}: CollapsibleCardProps) {
  return (
    <Card>
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base font-semibold">
            {icon}
            {title}
            {badge}
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </CardHeader>
      {expanded && <CardContent>{children}</CardContent>}
    </Card>
  )
}

// 翻译函数类型
type TranslationFunction = ReturnType<typeof useTranslations>

// 匹配度评分卡
function ScoreSummaryCard({
  matchScore,
  expanded,
  onToggle,
  t,
}: {
  matchScore: AnalysisDimensions['matchScore']
  expanded: boolean
  onToggle: () => void
  t: TranslationFunction
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRecommendationLabel = (rec: string) => {
    const colorMap: Record<string, string> = {
      strong_match: 'text-green-700 bg-green-100',
      good_match: 'text-blue-700 bg-blue-100',
      moderate_match: 'text-yellow-700 bg-yellow-100',
      weak_match: 'text-orange-700 bg-orange-100',
      not_recommended: 'text-red-700 bg-red-100',
    }
    return {
      text: t(`matchScore.recommendation.${rec}` as Parameters<typeof t>[0]),
      color: colorMap[rec] || 'text-gray-700 bg-gray-100'
    }
  }

  const recommendation = getRecommendationLabel(matchScore.recommendation)

  return (
    <CollapsibleCard
      title={t('matchScore.title')}
      icon={<BarChart3 className="w-5 h-5 text-primary-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className={`ml-2 px-2 py-0.5 rounded-full text-sm font-bold ${getScoreColor(matchScore.overall)}`}>
          {matchScore.overall}{t('matchScore.points')}
        </span>
      }
    >
      <div className="space-y-4">
        {/* 推荐结论 */}
        <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${recommendation.color}`}>
          {recommendation.text}
        </div>

        {/* 总结 */}
        <p className="text-sm text-gray-700">{matchScore.summary}</p>

        {/* 分项得分 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { key: 'skills', score: matchScore.breakdown.skillsScore },
            { key: 'experience', score: matchScore.breakdown.experienceScore },
            { key: 'education', score: matchScore.breakdown.educationScore },
            { key: 'cultureFit', score: matchScore.breakdown.cultureFitScore },
            { key: 'careerFit', score: matchScore.breakdown.careerFitScore },
          ].map((item) => (
            <div key={item.key} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">{t(`matchScore.breakdown.${item.key}` as Parameters<typeof t>[0])}</div>
              <div className="text-lg font-semibold text-gray-900">{item.score}</div>
            </div>
          ))}
        </div>

        {/* 置信度 */}
        <div className="text-xs text-gray-500">
          {t('matchScore.confidence.label')}: {t(`matchScore.confidence.${matchScore.confidence}` as Parameters<typeof t>[0])}
        </div>
      </div>
    </CollapsibleCard>
  )
}

// CV策略卡
function CVStrategyCard({
  cvStrategy,
  expanded,
  onToggle,
  t,
}: {
  cvStrategy: AnalysisDimensions['cvStrategy']
  expanded: boolean
  onToggle: () => void
  t: TranslationFunction
}) {
  return (
    <CollapsibleCard
      title={t('cvStrategy.title')}
      icon={<FileEdit className="w-5 h-5 text-indigo-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
          {t('cvStrategy.badge')}
        </span>
      }
    >
      <div className="space-y-4">
        {/* 职业目标指导 */}
        {cvStrategy.objectiveGuidance && (
          <div className="p-3 bg-indigo-50 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-900 mb-1">{t('cvStrategy.objectiveGuidance')}</h4>
            <p className="text-sm text-indigo-700">{cvStrategy.objectiveGuidance}</p>
          </div>
        )}

        {/* 章节顺序 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('cvStrategy.priorityOrder')}</h4>
          <div className="flex flex-wrap gap-2">
            {cvStrategy.priorityOrder.map((section, idx) => (
              <span
                key={section}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
              >
                <span className="w-4 h-4 flex items-center justify-center bg-primary-600 text-white rounded-full text-[10px]">
                  {idx + 1}
                </span>
                {t(`sections.${section}` as Parameters<typeof t>[0])}
              </span>
            ))}
          </div>
        </div>

        {/* 技能突出 */}
        {cvStrategy.skillsHighlight.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('cvStrategy.skillsHighlight')}</h4>
            <div className="flex flex-wrap gap-1.5">
              {cvStrategy.skillsHighlight.map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 项目突出 */}
        {cvStrategy.projectFocus.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('cvStrategy.projectFocus')}</h4>
            <div className="flex flex-wrap gap-1.5">
              {cvStrategy.projectFocus.map((project) => (
                <span
                  key={project}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {project}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 行动动词 */}
        {cvStrategy.actionVerbs.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('cvStrategy.actionVerbs')}</h4>
            <p className="text-sm text-gray-600">
              {cvStrategy.actionVerbs.slice(0, 10).join(', ')}
            </p>
          </div>
        )}

        {/* 量化建议 */}
        {cvStrategy.quantificationSuggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('cvStrategy.quantificationSuggestions')}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {cvStrategy.quantificationSuggestions.slice(0, 5).map((suggestion, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 应避免的内容 */}
        {cvStrategy.avoid.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('cvStrategy.avoid')}</h4>
            <div className="flex flex-wrap gap-1.5">
              {cvStrategy.avoid.map((item) => (
                <span
                  key={item}
                  className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 语气 */}
        <div className="text-xs text-gray-500">
          {t('cvStrategy.tone.label')}: {t(`cvStrategy.tone.${cvStrategy.tone}` as Parameters<typeof t>[0])}
        </div>
      </div>
    </CollapsibleCard>
  )
}

// SWOT卡
function SWOTCard({
  swot,
  expanded,
  onToggle,
  t,
}: {
  swot: AnalysisDimensions['swotAnalysis']
  expanded: boolean
  onToggle: () => void
  t: TranslationFunction
}) {
  return (
    <CollapsibleCard
      title={t('swot.title')}
      icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="grid md:grid-cols-2 gap-4">
        {/* 优势 */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
            <Shield className="w-4 h-4" /> {t('swot.strengths')}
          </h4>
          <ul className="space-y-2">
            {swot.strengths.map((s, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-medium text-green-700">{s.point}</span>
                <p className="text-green-600 text-xs">{s.evidence}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 劣势 */}
        <div className="p-3 bg-red-50 rounded-lg">
          <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {t('swot.weaknesses')}
          </h4>
          <ul className="space-y-2">
            {swot.weaknesses.map((w, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-medium text-red-700">{w.point}</span>
                <p className="text-red-600 text-xs">{t('swot.suggestion')}: {w.suggestion}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 机会 */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
            <Zap className="w-4 h-4" /> {t('swot.opportunities')}
          </h4>
          <ul className="space-y-2">
            {swot.opportunities.map((o, idx) => (
              <li key={idx} className="text-sm text-blue-700">
                {o.point}
                <span className="text-xs text-blue-500 ml-1">
                  ({t(`swot.timeframe.${o.timeframe}` as Parameters<typeof t>[0])})
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 威胁 */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> {t('swot.threats')}
          </h4>
          <ul className="space-y-2">
            {swot.threats.map((threat, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-medium text-yellow-700">{threat.point}</span>
                {threat.mitigation && (
                  <p className="text-yellow-600 text-xs">{t('swot.mitigation')}: {threat.mitigation}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 综合评估 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700">{swot.overallAssessment}</p>
      </div>
    </CollapsibleCard>
  )
}

// 关键词卡
function KeywordsCard({
  keywords,
  expanded,
  onToggle,
  t,
}: {
  keywords: AnalysisDimensions['keywordMatching']
  expanded: boolean
  onToggle: () => void
  t: TranslationFunction
}) {
  return (
    <CollapsibleCard
      title={t('keywords.title')}
      icon={<Tags className="w-5 h-5 text-cyan-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className="ml-2 text-xs text-gray-500">
          {keywords.overallMatchRate}{t('keywords.matchRate')}
        </span>
      }
    >
      <div className="space-y-4">
        {/* 匹配率 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">{t('keywords.requiredMatchRate')}</div>
            <div className="text-lg font-semibold text-gray-900">
              {keywords.requiredMatchRate}%
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">{t('keywords.atsFriendliness')}</div>
            <div className="text-lg font-semibold text-gray-900">
              {t(`keywords.ats.${keywords.atsFriendliness}` as Parameters<typeof t>[0])}
            </div>
          </div>
        </div>

        {/* 关键词列表 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">{t('keywords.keywordStatus')}</h4>
          <div className="flex flex-wrap gap-2">
            {keywords.keywords.slice(0, 20).map((kw) => (
              <span
                key={kw.keyword}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                  kw.found
                    ? 'bg-green-100 text-green-700'
                    : kw.importance === 'required'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                }`}
              >
                {kw.found ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                {kw.keyword}
              </span>
            ))}
          </div>
        </div>

        {/* 建议添加 */}
        {keywords.suggestedAdditions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('keywords.suggestedAdditions')}</h4>
            <div className="flex flex-wrap gap-1.5">
              {keywords.suggestedAdditions.map((kw) => (
                <span
                  key={kw}
                  className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs"
                >
                  + {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

// 关键要求卡
function RequirementsCard({
  requirements,
  expanded,
  onToggle,
  t,
}: {
  requirements: AnalysisDimensions['keyRequirements']
  expanded: boolean
  onToggle: () => void
  t: TranslationFunction
}) {
  return (
    <CollapsibleCard
      title={t('requirements.title')}
      icon={<ClipboardCheck className="w-5 h-5 text-amber-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className="ml-2 text-xs text-gray-500">
          {t('requirements.mandatoryRate')} {requirements.mandatoryFulfillmentRate}%
        </span>
      }
    >
      <div className="space-y-4">
        {/* 主要优势 */}
        {requirements.majorStrengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">{t('requirements.strengths')}</h4>
            <ul className="space-y-1">
              {requirements.majorStrengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 主要差距 */}
        {requirements.majorGaps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-700 mb-2">{t('requirements.gaps')}</h4>
            <ul className="space-y-1">
              {requirements.majorGaps.map((g, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 详细要求列表 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('requirements.details')}</h4>
          <div className="space-y-2">
            {requirements.requirements.slice(0, 10).map((req, idx) => (
              <div
                key={idx}
                className={`p-2 rounded text-sm ${
                  req.met ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={req.mandatory ? 'font-medium' : ''}>
                    {req.description}
                    {req.mandatory && (
                      <span className="ml-1 text-xs text-red-500">*{t('requirements.required')}</span>
                    )}
                  </span>
                </div>
                {req.evidence && (
                  <p className="ml-6 text-xs text-gray-500">{req.evidence}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleCard>
  )
}

// 面试准备卡
function InterviewPrepCard({
  interviewPrep,
  expanded,
  onToggle,
  t,
}: {
  interviewPrep: AnalysisDimensions['interviewPreparation']
  expanded: boolean
  onToggle: () => void
  t: TranslationFunction
}) {
  return (
    <CollapsibleCard
      title={t('interview.title')}
      icon={<MessageSquare className="w-5 h-5 text-rose-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {/* 预计问题 */}
        {interviewPrep.likelyQuestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('interview.likelyQuestions')}</h4>
            <div className="space-y-3">
              {interviewPrep.likelyQuestions.slice(0, 5).map((q, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">
                      {t(`interview.questionType.${q.type}` as Parameters<typeof t>[0])}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">
                      {t(`interview.difficulty.${q.difficulty}` as Parameters<typeof t>[0])}
                    </span>
                  </div>
                  {q.answerPoints.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600 space-y-1">
                      {q.answerPoints.map((point, i) => (
                        <li key={i}>• {point}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 需要复习的技术点 */}
        {interviewPrep.technicalReview.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('interview.technicalReview')}</h4>
            <div className="flex flex-wrap gap-2">
              {interviewPrep.technicalReview.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 应该问的问题 */}
        {interviewPrep.questionsToAsk.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('interview.questionsToAsk')}</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {interviewPrep.questionsToAsk.slice(0, 5).map((q, idx) => (
                <li key={idx}>• {q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* 面试技巧 */}
        {interviewPrep.tips.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('interview.tips')}</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              {interviewPrep.tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Lightbulb className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </CollapsibleCard>
  )
}

// 角色定位卡
function RolePositioningCard({
  positioning,
  expanded,
  onToggle,
  t,
}: {
  positioning: AnalysisDimensions['rolePositioning']
  expanded: boolean
  onToggle: () => void
  t: TranslationFunction
}) {
  return (
    <CollapsibleCard
      title={t('rolePositioning.title')}
      icon={<Target className="w-5 h-5 text-teal-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">{positioning.summary}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">{t('rolePositioning.level')}</div>
            <div className="text-sm font-medium text-gray-900">
              {t(`rolePositioning.levels.${positioning.level}` as Parameters<typeof t>[0])}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">{t('rolePositioning.domain')}</div>
            <div className="text-sm font-medium text-gray-900">
              {positioning.domain}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">{t('rolePositioning.primaryFunction')}</div>
            <div className="text-sm font-medium text-gray-900">
              {positioning.primaryFunction}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">{t('rolePositioning.readiness')}</div>
            <div className="text-sm font-medium text-gray-900">
              {t(`rolePositioning.readinessStatus.${positioning.candidateFit.readiness}` as Parameters<typeof t>[0])}
            </div>
          </div>
        </div>

        {/* 候选人定位 */}
        <div className="p-3 bg-teal-50 rounded-lg">
          <h4 className="text-sm font-medium text-teal-800 mb-2">{t('rolePositioning.yourPositioning')}</h4>
          <div className="text-sm text-teal-700 space-y-1">
            <p>{t('rolePositioning.currentLevel')}{positioning.candidateFit.currentLevel}</p>
            <p>{t('rolePositioning.targetLevel')}{positioning.candidateFit.targetLevel}</p>
            <p>{t('rolePositioning.gap')}{positioning.candidateFit.gap}</p>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  )
}

// 核心职责卡
function ResponsibilitiesCard({
  responsibilities,
  expanded,
  onToggle,
  t,
}: {
  responsibilities: AnalysisDimensions['coreResponsibilities']
  expanded: boolean
  onToggle: () => void
  t: TranslationFunction
}) {
  return (
    <CollapsibleCard
      title={t('responsibilities.title')}
      icon={<ListChecks className="w-5 h-5 text-orange-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className="ml-2 text-xs text-gray-500">
          {t('responsibilities.coverageRate')} {responsibilities.coverageScore}%
        </span>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">{responsibilities.summary}</p>

        <div className="space-y-2">
          {responsibilities.responsibilities.map((resp, idx) => (
            <div
              key={idx}
              className={`p-2 rounded text-sm ${
                resp.matchStatus === 'strong'
                  ? 'bg-green-50'
                  : resp.matchStatus === 'partial'
                    ? 'bg-yellow-50'
                    : 'bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-2">
                {resp.matchStatus === 'strong' ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                ) : resp.matchStatus === 'partial' ? (
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <span className={resp.importance === 'critical' ? 'font-medium' : ''}>
                    {resp.description}
                  </span>
                  {resp.candidateEvidence && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('responsibilities.evidence')}{resp.candidateEvidence}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    resp.importance === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : resp.importance === 'important'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t(`responsibilities.importance.${resp.importance}` as Parameters<typeof t>[0])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CollapsibleCard>
  )
}

