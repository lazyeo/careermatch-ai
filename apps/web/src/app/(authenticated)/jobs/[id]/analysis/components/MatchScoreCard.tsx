import { MatchScoreBadge } from '@careermatch/ui'

interface MatchScoreCardProps {
  score: number
}

export function MatchScoreCard({ score }: MatchScoreCardProps) {
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: 'Strong Match', color: 'text-success-600', bgColor: 'bg-success-50' }
    if (score >= 60) return { label: 'Worth Applying', color: 'text-warning-600', bgColor: 'bg-warning-50' }
    if (score >= 40) return { label: 'Possible Fit', color: 'text-neutral-600', bgColor: 'bg-neutral-50' }
    return { label: 'Low Match', color: 'text-error-600', bgColor: 'bg-error-50' }
  }

  const level = getScoreLevel(score)

  return (
    <div className={`${level.bgColor} rounded-lg p-6 text-center`}>
      <div className="mb-3">
        <MatchScoreBadge score={score} size="lg" />
      </div>
      <h3 className={`text-2xl font-bold ${level.color} mb-1`}>
        {level.label}
      </h3>
      <p className="text-sm text-gray-600">
        Overall match score
      </p>
    </div>
  )
}
