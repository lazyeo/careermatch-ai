import { Check, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@careermatch/ui'
import type { KeywordMatch } from '@careermatch/shared'

interface KeywordsTableProps {
  keywords: KeywordMatch[]
}

export function KeywordsTable({ keywords }: KeywordsTableProps) {
  const getImportanceBadge = (importance: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-error-100 text-error-700',
      medium: 'bg-warning-100 text-warning-700',
      low: 'bg-neutral-100 text-neutral-700',
    }
    const labels = {
      high: '高',
      medium: '中',
      low: '低',
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[importance]}`}>
        {labels[importance]}
      </span>
    )
  }

  // Sort by importance and presence in resume
  const sortedKeywords = [...keywords].sort((a, b) => {
    const importanceOrder = { high: 0, medium: 1, low: 2 }
    if (a.inResume !== b.inResume) return a.inResume ? -1 : 1
    return importanceOrder[a.importance] - importanceOrder[b.importance]
  })

  const matched = keywords.filter((k) => k.inResume).length
  const total = keywords.length
  const matchPercentage = Math.round((matched / total) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>关键词匹配分析</CardTitle>
          <div className="text-sm">
            <span className="text-gray-600">匹配率：</span>
            <span className="font-semibold text-primary-600">
              {matched}/{total} ({matchPercentage}%)
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">关键词</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">简历中</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">重要性</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">建议</th>
              </tr>
            </thead>
            <tbody>
              {sortedKeywords.map((keyword, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{keyword.keyword}</td>
                  <td className="py-3 px-4 text-center">
                    {keyword.inResume ? (
                      <Check className="w-5 h-5 text-success-600 inline-block" />
                    ) : (
                      <X className="w-5 h-5 text-error-600 inline-block" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getImportanceBadge(keyword.importance)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {keyword.context || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
