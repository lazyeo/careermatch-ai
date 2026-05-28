const TRIGGER_ENV_MISMATCH_MESSAGE =
  'Production is using a Trigger.dev development key. Set Vercel Production TRIGGER_SECRET_KEY to a tr_prod_ key, then restart analysis.'

export function assertTriggerSecretMatchesDeployment() {
  const secretKey = process.env.TRIGGER_SECRET_KEY

  if (!secretKey) {
    throw new Error('TRIGGER_SECRET_KEY is not configured')
  }

  if (process.env.VERCEL_ENV === 'production' && secretKey.startsWith('tr_dev_')) {
    throw new Error(TRIGGER_ENV_MISMATCH_MESSAGE)
  }
}
