import { test } from 'node:test'
import * as assert from 'node:assert/strict'

import {
  buildJobAnalysisSummaryUpdate,
  decideNextAction,
  toAnalysisSessionRecommendation,
} from './decide-next-action'

test('decideNextAction recommends artifact generation for strong matches and high scores', () => {
  assert.equal(decideNextAction({ score: 83, recommendation: 'good_match' }), 'generate_resume')
  assert.equal(decideNextAction({ score: 65, recommendation: 'strong_match' }), 'generate_resume')
})

test('decideNextAction recommends review or skip for lower-confidence matches', () => {
  assert.equal(decideNextAction({ score: 74, recommendation: 'good_match' }), 'review')
  assert.equal(decideNextAction({ score: 62, recommendation: 'moderate_match' }), 'review_later')
  assert.equal(decideNextAction({ score: 45, recommendation: 'weak_match' }), 'skip')
  assert.equal(decideNextAction({ score: 90, recommendation: 'not_recommended' }), 'skip')
  assert.equal(decideNextAction({ score: 65, recommendation: 'strong' }), 'generate_resume')
  assert.equal(decideNextAction({ score: 45, recommendation: 'weak' }), 'skip')
})

test('buildJobAnalysisSummaryUpdate materializes the latest analysis state for a job row', () => {
  const update = buildJobAnalysisSummaryUpdate({
    analysisSessionId: 'session-1',
    score: 83,
    recommendation: 'good_match',
  })

  assert.equal(update.latest_analysis_session_id, 'session-1')
  assert.equal(update.latest_score, 83)
  assert.equal(update.latest_recommendation, 'moderate')
  assert.equal(update.recommended_next_action, 'generate_resume')
  assert.equal(update.autoprocess_status, 'analysis_completed')
  assert.equal(typeof update.last_analyzed_at, 'string')
})

test('toAnalysisSessionRecommendation maps AI prompt recommendations to DB-safe values', () => {
  assert.equal(toAnalysisSessionRecommendation('strong_match', 86), 'strong')
  assert.equal(toAnalysisSessionRecommendation('good_match', 78), 'moderate')
  assert.equal(toAnalysisSessionRecommendation('moderate_match', 62), 'moderate')
  assert.equal(toAnalysisSessionRecommendation('weak_match', 45), 'weak')
  assert.equal(toAnalysisSessionRecommendation('not_recommended', 20), 'not_recommended')
})
