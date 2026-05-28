export type JobRecommendation =
  | 'strong_match'
  | 'good_match'
  | 'moderate_match'
  | 'weak_match'
  | 'not_recommended'
  | 'strong'
  | 'moderate'
  | 'weak'

export type AnalysisSessionRecommendation =
  | 'strong'
  | 'moderate'
  | 'weak'
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
  if (recommendation === 'not_recommended' || recommendation === 'weak_match' || recommendation === 'weak') {
    return 'skip'
  }

  if (recommendation === 'strong_match' || recommendation === 'strong' || score >= 80) {
    return 'generate_resume'
  }

  if (recommendation === 'good_match' || score >= 70) {
    return 'review'
  }

  return 'review_later'
}

export function toAnalysisSessionRecommendation(
  recommendation: string,
  score?: number
): AnalysisSessionRecommendation {
  if (recommendation === 'strong' || recommendation === 'strong_match') {
    return 'strong'
  }

  if (
    recommendation === 'moderate' ||
    recommendation === 'good_match' ||
    recommendation === 'moderate_match'
  ) {
    return 'moderate'
  }

  if (recommendation === 'weak' || recommendation === 'weak_match') {
    return 'weak'
  }

  if (recommendation === 'not_recommended') {
    return 'not_recommended'
  }

  if (typeof score === 'number') {
    if (score >= 85) return 'strong'
    if (score >= 65) return 'moderate'
    if (score >= 40) return 'weak'
  }

  return 'not_recommended'
}

export function buildJobAnalysisSummaryUpdate(input: JobAnalysisSummaryInput) {
  return {
    latest_analysis_session_id: input.analysisSessionId,
    latest_score: input.score,
    latest_recommendation: toAnalysisSessionRecommendation(input.recommendation, input.score),
    recommended_next_action: decideNextAction(input),
    autoprocess_status: 'analysis_completed',
    last_analyzed_at: new Date().toISOString(),
  }
}
