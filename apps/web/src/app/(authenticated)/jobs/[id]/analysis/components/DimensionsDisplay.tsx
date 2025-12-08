'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
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
      />

      {/* 2. CV策略 - 核心 */}
      <CVStrategyCard
        cvStrategy={dimensions.cvStrategy}
        expanded={expandedSections.has('cvStrategy')}
        onToggle={() => toggleSection('cvStrategy')}
      />

      {/* 3. SWOT分析 */}
      <SWOTCard
        swot={dimensions.swotAnalysis}
        expanded={expandedSections.has('swot')}
        onToggle={() => toggleSection('swot')}
      />

      {/* 4. 关键词匹配 */}
      <KeywordsCard
        keywords={dimensions.keywordMatching}
        expanded={expandedSections.has('keywords')}
        onToggle={() => toggleSection('keywords')}
      />

      {/* 5. 关键要求 */}
      <RequirementsCard
        requirements={dimensions.keyRequirements}
        expanded={expandedSections.has('requirements')}
        onToggle={() => toggleSection('requirements')}
      />

      {/* 6. 面试准备 */}
      <InterviewPrepCard
        interviewPrep={dimensions.interviewPreparation}
        expanded={expandedSections.has('interview')}
        onToggle={() => toggleSection('interview')}
      />

      {/* 7. 角色定位 */}
      <RolePositioningCard
        positioning={dimensions.rolePositioning}
        expanded={expandedSections.has('role')}
        onToggle={() => toggleSection('role')}
      />

      {/* 8. 核心职责 */}
      <ResponsibilitiesCard
        responsibilities={dimensions.coreResponsibilities}
        expanded={expandedSections.has('responsibilities')}
        onToggle={() => toggleSection('responsibilities')}
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

// 匹配度评分卡
function ScoreSummaryCard({
  matchScore,
  expanded,
  onToggle,
}: {
  matchScore: AnalysisDimensions['matchScore']
  expanded: boolean
  onToggle: () => void
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-blue-600 bg-blue-100'
    if (score >= 40) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getRecommendationLabel = (rec: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      strong_match: { text: '强烈推荐申请', color: 'text-green-700 bg-green-100' },
      good_match: { text: '推荐申请', color: 'text-blue-700 bg-blue-100' },
      moderate_match: { text: '可以考虑', color: 'text-yellow-700 bg-yellow-100' },
      weak_match: { text: '需提升后申请', color: 'text-orange-700 bg-orange-100' },
      not_recommended: { text: '暂不推荐', color: 'text-red-700 bg-red-100' },
    }
    return labels[rec] || { text: rec, color: 'text-gray-700 bg-gray-100' }
  }

  const recommendation = getRecommendationLabel(matchScore.recommendation)

  return (
    <CollapsibleCard
      title="匹配度评分"
      icon={<BarChart3 className="w-5 h-5 text-primary-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className={`ml-2 px-2 py-0.5 rounded-full text-sm font-bold ${getScoreColor(matchScore.overall)}`}>
          {matchScore.overall}分
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
            { label: '技能匹配', score: matchScore.breakdown.skillsScore },
            { label: '经验匹配', score: matchScore.breakdown.experienceScore },
            { label: '教育匹配', score: matchScore.breakdown.educationScore },
            { label: '文化契合', score: matchScore.breakdown.cultureFitScore },
            { label: '职业发展', score: matchScore.breakdown.careerFitScore },
          ].map((item) => (
            <div key={item.label} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="text-lg font-semibold text-gray-900">{item.score}</div>
            </div>
          ))}
        </div>

        {/* 置信度 */}
        <div className="text-xs text-gray-500">
          分析置信度：{matchScore.confidence === 'high' ? '高' : matchScore.confidence === 'medium' ? '中' : '低'}
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
}: {
  cvStrategy: AnalysisDimensions['cvStrategy']
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <CollapsibleCard
      title="简历策略"
      icon={<FileEdit className="w-5 h-5 text-indigo-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
          核心
        </span>
      }
    >
      <div className="space-y-4">
        {/* 职业目标指导 */}
        {cvStrategy.objectiveGuidance && (
          <div className="p-3 bg-indigo-50 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-900 mb-1">职业目标撰写指导</h4>
            <p className="text-sm text-indigo-700">{cvStrategy.objectiveGuidance}</p>
          </div>
        )}

        {/* 章节顺序 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">推荐章节顺序</h4>
          <div className="flex flex-wrap gap-2">
            {cvStrategy.priorityOrder.map((section, idx) => (
              <span
                key={section}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
              >
                <span className="w-4 h-4 flex items-center justify-center bg-primary-600 text-white rounded-full text-[10px]">
                  {idx + 1}
                </span>
                {getSectionLabel(section)}
              </span>
            ))}
          </div>
        </div>

        {/* 技能突出 */}
        {cvStrategy.skillsHighlight.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">应突出的技能</h4>
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">应突出的项目</h4>
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">推荐使用的动词</h4>
            <p className="text-sm text-gray-600">
              {cvStrategy.actionVerbs.slice(0, 10).join('、')}
            </p>
          </div>
        )}

        {/* 量化建议 */}
        {cvStrategy.quantificationSuggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">量化建议</h4>
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">应避免/淡化</h4>
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
          推荐语气：{getToneLabel(cvStrategy.tone)}
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
}: {
  swot: AnalysisDimensions['swotAnalysis']
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <CollapsibleCard
      title="SWOT分析"
      icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="grid md:grid-cols-2 gap-4">
        {/* 优势 */}
        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
            <Shield className="w-4 h-4" /> 优势
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
            <AlertCircle className="w-4 h-4" /> 劣势
          </h4>
          <ul className="space-y-2">
            {swot.weaknesses.map((w, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-medium text-red-700">{w.point}</span>
                <p className="text-red-600 text-xs">建议：{w.suggestion}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 机会 */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1">
            <Zap className="w-4 h-4" /> 机会
          </h4>
          <ul className="space-y-2">
            {swot.opportunities.map((o, idx) => (
              <li key={idx} className="text-sm text-blue-700">
                {o.point}
                <span className="text-xs text-blue-500 ml-1">
                  ({getTimeframeLabel(o.timeframe)})
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 威胁 */}
        <div className="p-3 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> 威胁
          </h4>
          <ul className="space-y-2">
            {swot.threats.map((t, idx) => (
              <li key={idx} className="text-sm">
                <span className="font-medium text-yellow-700">{t.point}</span>
                {t.mitigation && (
                  <p className="text-yellow-600 text-xs">应对：{t.mitigation}</p>
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
}: {
  keywords: AnalysisDimensions['keywordMatching']
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <CollapsibleCard
      title="关键词匹配"
      icon={<Tags className="w-5 h-5 text-cyan-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className="ml-2 text-xs text-gray-500">
          {keywords.overallMatchRate}% 匹配
        </span>
      }
    >
      <div className="space-y-4">
        {/* 匹配率 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">必需关键词匹配率</div>
            <div className="text-lg font-semibold text-gray-900">
              {keywords.requiredMatchRate}%
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">ATS友好度</div>
            <div className="text-lg font-semibold text-gray-900">
              {getATSLabel(keywords.atsFriendliness)}
            </div>
          </div>
        </div>

        {/* 关键词列表 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">关键词状态</h4>
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">建议添加</h4>
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
}: {
  requirements: AnalysisDimensions['keyRequirements']
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <CollapsibleCard
      title="关键要求"
      icon={<ClipboardCheck className="w-5 h-5 text-amber-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className="ml-2 text-xs text-gray-500">
          必需满足 {requirements.mandatoryFulfillmentRate}%
        </span>
      }
    >
      <div className="space-y-4">
        {/* 主要优势 */}
        {requirements.majorStrengths.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">你的优势</h4>
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
            <h4 className="text-sm font-medium text-red-700 mb-2">需要提升</h4>
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
          <h4 className="text-sm font-medium text-gray-700 mb-2">详细要求</h4>
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
                      <span className="ml-1 text-xs text-red-500">*必需</span>
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
}: {
  interviewPrep: AnalysisDimensions['interviewPreparation']
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <CollapsibleCard
      title="面试准备"
      icon={<MessageSquare className="w-5 h-5 text-rose-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-4">
        {/* 预计问题 */}
        {interviewPrep.likelyQuestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">预计面试问题</h4>
            <div className="space-y-3">
              {interviewPrep.likelyQuestions.slice(0, 5).map((q, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">
                      {getQuestionTypeLabel(q.type)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-200 rounded">
                      {getDifficultyLabel(q.difficulty)}
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">需要复习</h4>
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">你可以问的问题</h4>
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
            <h4 className="text-sm font-medium text-gray-700 mb-2">面试技巧</h4>
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
}: {
  positioning: AnalysisDimensions['rolePositioning']
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <CollapsibleCard
      title="角色定位"
      icon={<Target className="w-5 h-5 text-teal-600" />}
      expanded={expanded}
      onToggle={onToggle}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">{positioning.summary}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">级别</div>
            <div className="text-sm font-medium text-gray-900">
              {getLevelLabel(positioning.level)}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">领域</div>
            <div className="text-sm font-medium text-gray-900">
              {positioning.domain}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">主要职能</div>
            <div className="text-sm font-medium text-gray-900">
              {positioning.primaryFunction}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">匹配准备度</div>
            <div className="text-sm font-medium text-gray-900">
              {getReadinessLabel(positioning.candidateFit.readiness)}
            </div>
          </div>
        </div>

        {/* 候选人定位 */}
        <div className="p-3 bg-teal-50 rounded-lg">
          <h4 className="text-sm font-medium text-teal-800 mb-2">你的定位</h4>
          <div className="text-sm text-teal-700 space-y-1">
            <p>当前级别：{positioning.candidateFit.currentLevel}</p>
            <p>目标级别：{positioning.candidateFit.targetLevel}</p>
            <p>差距：{positioning.candidateFit.gap}</p>
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
}: {
  responsibilities: AnalysisDimensions['coreResponsibilities']
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <CollapsibleCard
      title="核心职责"
      icon={<ListChecks className="w-5 h-5 text-orange-600" />}
      expanded={expanded}
      onToggle={onToggle}
      badge={
        <span className="ml-2 text-xs text-gray-500">
          覆盖率 {responsibilities.coverageScore}%
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
                      证据：{resp.candidateEvidence}
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
                  {getImportanceLabel(resp.importance)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CollapsibleCard>
  )
}

// =====================================================
// 工具函数
// =====================================================

function getSectionLabel(section: string): string {
  const labels: Record<string, string> = {
    header: '个人信息',
    summary: '职业目标',
    skills: '技能',
    experience: '工作经历',
    projects: '项目',
    education: '教育背景',
    certifications: '证书',
    awards: '获奖',
    publications: '发表',
    languages: '语言',
    volunteer: '志愿者',
  }
  return labels[section] || section
}

function getToneLabel(tone: string): string {
  const labels: Record<string, string> = {
    formal: '正式专业',
    conversational: '自然亲切',
    technical: '技术导向',
    creative: '创意活泼',
    executive: '高管风格',
  }
  return labels[tone] || tone
}

function getTimeframeLabel(timeframe: string): string {
  const labels: Record<string, string> = {
    short_term: '短期',
    medium_term: '中期',
    long_term: '长期',
  }
  return labels[timeframe] || timeframe
}

function getATSLabel(ats: string): string {
  const labels: Record<string, string> = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差',
  }
  return labels[ats] || ats
}

function getQuestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    behavioral: '行为题',
    technical: '技术题',
    situational: '情景题',
    competency: '能力题',
    motivation: '动机题',
  }
  return labels[type] || type
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    basic: '基础',
    intermediate: '中级',
    advanced: '高级',
  }
  return labels[difficulty] || difficulty
}

function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    entry: '入门级',
    junior: '初级',
    mid: '中级',
    senior: '高级',
    lead: '负责人',
    principal: '首席',
    executive: '高管',
  }
  return labels[level] || level
}

function getReadinessLabel(readiness: string): string {
  const labels: Record<string, string> = {
    ready: '已准备好',
    stretch: '有挑战',
    gap: '有差距',
    overqualified: '资历过高',
  }
  return labels[readiness] || readiness
}

function getImportanceLabel(importance: string): string {
  const labels: Record<string, string> = {
    critical: '关键',
    important: '重要',
    nice_to_have: '加分项',
  }
  return labels[importance] || importance
}
