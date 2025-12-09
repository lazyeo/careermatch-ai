'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'
import { Brain, FileText, Target, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react'

interface StreamingContentProps {
  content: string
}

interface ParsedSections {
  thinking: string      // 思考过程（分隔符之前的内容）
  score: string | null
  recommendation: string | null
  dimensions: string | null
  analysis: string | null
  currentSection: 'thinking' | 'score' | 'recommendation' | 'dimensions' | 'analysis' | 'done'
}

/**
 * 实时解析流式内容
 */
function parseStreamingContent(content: string): ParsedSections {
  const result: ParsedSections = {
    thinking: '',
    score: null,
    recommendation: null,
    dimensions: null,
    analysis: null,
    currentSection: 'thinking',
  }

  // 检查各个分隔符的位置
  const scoreIndex = content.indexOf('---SCORE---')
  const recIndex = content.indexOf('---RECOMMENDATION---')
  const dimIndex = content.indexOf('---DIMENSIONS---')
  const analysisIndex = content.indexOf('---ANALYSIS---')
  const endIndex = content.indexOf('---END---')

  // 提取思考过程（分隔符之前的所有内容）
  if (scoreIndex > 0) {
    result.thinking = content.substring(0, scoreIndex).trim()
  } else {
    result.thinking = content
    result.currentSection = 'thinking'
    return result
  }

  // 提取分数
  if (scoreIndex !== -1 && recIndex !== -1) {
    result.score = content.substring(scoreIndex + 11, recIndex).trim()
    result.currentSection = 'score'
  } else if (scoreIndex !== -1) {
    result.score = content.substring(scoreIndex + 11).trim()
    result.currentSection = 'score'
    return result
  }

  // 提取推荐等级
  if (recIndex !== -1 && dimIndex !== -1) {
    result.recommendation = content.substring(recIndex + 20, dimIndex).trim()
    result.currentSection = 'recommendation'
  } else if (recIndex !== -1) {
    result.recommendation = content.substring(recIndex + 20).trim()
    result.currentSection = 'recommendation'
    return result
  }

  // 提取维度数据
  if (dimIndex !== -1 && analysisIndex !== -1) {
    result.dimensions = content.substring(dimIndex + 16, analysisIndex).trim()
    result.currentSection = 'dimensions'
  } else if (dimIndex !== -1) {
    result.dimensions = content.substring(dimIndex + 16).trim()
    result.currentSection = 'dimensions'
    return result
  }

  // 提取分析报告
  if (analysisIndex !== -1 && endIndex !== -1) {
    result.analysis = content.substring(analysisIndex + 14, endIndex).trim()
    result.currentSection = 'done'
  } else if (analysisIndex !== -1) {
    result.analysis = content.substring(analysisIndex + 14).trim()
    result.currentSection = 'analysis'
    return result
  }

  return result
}

/**
 * 获取推荐等级的中文和颜色
 */
function getRecommendationDisplay(rec: string | null): { text: string; color: string } {
  if (!rec) return { text: '分析中...', color: 'text-gray-500' }

  const map: Record<string, { text: string; color: string }> = {
    strong_match: { text: '强烈推荐', color: 'text-green-600' },
    good_match: { text: '推荐申请', color: 'text-blue-600' },
    moderate_match: { text: '可以考虑', color: 'text-yellow-600' },
    weak_match: { text: '谨慎考虑', color: 'text-orange-600' },
    not_recommended: { text: '不太匹配', color: 'text-red-600' },
  }

  return map[rec.toLowerCase()] || { text: rec, color: 'text-gray-600' }
}

/**
 * 流式内容显示组件
 * 实时解析并分区显示AI生成的内容
 */
export function StreamingContent({ content }: StreamingContentProps) {
  const [showThinking, setShowThinking] = useState(false)

  const parsed = useMemo(() => parseStreamingContent(content), [content])
  const recDisplay = getRecommendationDisplay(parsed.recommendation)

  // 计算当前阶段进度
  const sectionProgress = {
    thinking: parsed.currentSection !== 'thinking',
    score: parsed.score !== null,
    recommendation: parsed.recommendation !== null,
    dimensions: parsed.dimensions !== null,
    analysis: parsed.analysis !== null,
  }

  return (
    <div className="space-y-4">
      {/* 思考过程（可折叠） */}
      {parsed.thinking && (
        <Card className="border-gray-200">
          <CardHeader className="py-3 cursor-pointer" onClick={() => setShowThinking(!showThinking)}>
            <CardTitle className="text-sm flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-600">
                <Brain className="w-4 h-4" />
                AI思考过程
                {parsed.currentSection === 'thinking' && (
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-normal">
                  {parsed.thinking.length} 字符
                </span>
                {showThinking ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          {showThinking && (
            <CardContent className="pt-0">
              <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">
                  {parsed.thinking}
                  {parsed.currentSection === 'thinking' && (
                    <span className="inline-block w-1.5 h-3 bg-gray-400 animate-pulse ml-0.5" />
                  )}
                </pre>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* 评分和推荐 */}
      {(parsed.score || parsed.recommendation) && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* 分数 */}
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm text-gray-600">匹配度：</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {parsed.score || '...'}
                    {parsed.score && <span className="text-sm font-normal">分</span>}
                  </span>
                </div>

                {/* 分隔线 */}
                <div className="w-px h-8 bg-gray-300" />

                {/* 推荐等级 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">推荐：</span>
                  <span className={`font-semibold ${recDisplay.color}`}>
                    {recDisplay.text}
                  </span>
                </div>
              </div>

              {/* 进度指示 */}
              <div className="flex items-center gap-1">
                {sectionProgress.score && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {sectionProgress.recommendation && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {!sectionProgress.dimensions && parsed.currentSection !== 'thinking' && (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 8维度数据生成中 */}
      {parsed.dimensions !== null && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
              <FileText className="w-4 h-4" />
              8维度分析数据
              {parsed.currentSection === 'dimensions' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-white/60 rounded-lg p-3 max-h-48 overflow-y-auto">
              <pre className="text-xs text-purple-800 whitespace-pre-wrap font-mono">
                {parsed.dimensions.substring(0, 500)}
                {parsed.dimensions.length > 500 && '...'}
                {parsed.currentSection === 'dimensions' && (
                  <span className="inline-block w-1.5 h-3 bg-purple-400 animate-pulse ml-0.5" />
                )}
              </pre>
            </div>
            {parsed.dimensions.length > 500 && (
              <p className="text-xs text-purple-500 mt-2">
                已生成 {parsed.dimensions.length} 字符的结构化数据...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 分析报告 */}
      {parsed.analysis !== null && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2 text-green-700">
              <FileText className="w-4 h-4" />
              详细分析报告
              {parsed.currentSection === 'analysis' ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-white/60 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="prose prose-sm prose-green max-w-none">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {parsed.analysis}
                  {parsed.currentSection === 'analysis' && (
                    <span className="inline-block w-2 h-4 bg-green-500 animate-pulse ml-0.5" />
                  )}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 完成提示 */}
      {parsed.currentSection === 'done' && (
        <div className="text-center py-2">
          <p className="text-sm text-green-600 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            分析完成，正在处理结果...
          </p>
        </div>
      )}
    </div>
  )
}
