import assert from 'node:assert/strict'
import test from 'node:test'

import { assertTriggerSecretMatchesDeployment } from './validate-trigger-environment'

function withEnv(
  env: Partial<NodeJS.ProcessEnv>,
  run: () => void
) {
  const originalTriggerKey = process.env.TRIGGER_SECRET_KEY
  const originalVercelEnv = process.env.VERCEL_ENV

  try {
    process.env.TRIGGER_SECRET_KEY = env.TRIGGER_SECRET_KEY
    process.env.VERCEL_ENV = env.VERCEL_ENV
    run()
  } finally {
    process.env.TRIGGER_SECRET_KEY = originalTriggerKey
    process.env.VERCEL_ENV = originalVercelEnv
  }
}

test('allows production deployments to use a production Trigger.dev key', () => {
  withEnv({ TRIGGER_SECRET_KEY: 'tr_prod_example', VERCEL_ENV: 'production' }, () => {
    assert.doesNotThrow(() => assertTriggerSecretMatchesDeployment())
  })
})

test('blocks production deployments that are configured with a development Trigger.dev key', () => {
  withEnv({ TRIGGER_SECRET_KEY: 'tr_dev_example', VERCEL_ENV: 'production' }, () => {
    assert.throws(
      () => assertTriggerSecretMatchesDeployment(),
      /Production is using a Trigger\.dev development key/
    )
  })
})
