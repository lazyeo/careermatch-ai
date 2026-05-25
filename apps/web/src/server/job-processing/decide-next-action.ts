export type JobRecommendation =
  | 'strong_match'
  | 'good_match'
  | 'moderate_match'
  | 'weak_match'
  | 'not_recommended'

export type RecommendedNextAction =
  | 'generate_resume'
  | 'review'
  | 'review_later'
  | 'skip'

export type JobAnalysisSummaryInput = {
  analysisSessionId: string
  score: number
  recommendation: string
}

export function decideNextAction({
  score,
  recommendation,
}: Pick<JobAnalysisSummaryInput, 'score' | 'recommendation'>): RecommendedNextAction {
  if (recommendation === 'not_recommended' || recommendation === 'weak_match') {
    return 'skip'
  }

  if (recommendation === 'strong_match' || score >= 80) {
    return 'generate_resume'
  }

  if (recommendation === 'good_match' || score >= 70) {
    return 'review'
  }

  return 'review_later'
}

export function buildJobAnalysisSummaryUpdate(input: JobAnalysisSummaryInput) {
  return {
    latest_analysis_session_id: input.analysisSessionId,
    latest_score: input.score,
    latest_recommendation: input.recommendation,
    recommended_next_action: decideNextAction(input),
    autoprocess_status: 'analysis_completed',
    last_analyzed_at: new Date().toISOString(),
  }
}
