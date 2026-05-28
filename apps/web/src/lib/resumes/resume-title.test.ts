import { test } from 'node:test'
import * as assert from 'node:assert/strict'

import { buildGeneratedResumeTitle } from './resume-title'

test('buildGeneratedResumeTitle uses a clean English generated resume title', () => {
  assert.equal(
    buildGeneratedResumeTitle({ title: 'Frontend Engineer', company: 'Acme' }),
    'Resume - Frontend Engineer at Acme'
  )
})

test('buildGeneratedResumeTitle does not add implementation labels', () => {
  const title = buildGeneratedResumeTitle({
    title: 'Product Manager',
    company: 'CareerMatch',
  })

  assert.equal(title.includes('简历'), false)
  assert.equal(title.includes('(V2)'), false)
})
