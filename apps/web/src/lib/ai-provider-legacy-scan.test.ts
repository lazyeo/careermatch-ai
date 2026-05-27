import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const repoRoot = join(__dirname, '../../../../')
const scanRoots = ['apps/web/src', 'packages', 'workers']
const runtimeFilePattern = /\.(ts|tsx|js|jsx)$/
const ignoredPathParts = new Set([
  'node_modules',
  '.next',
  'dist',
  '.turbo',
])

function collectRuntimeFiles(dir: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const relativePath = relative(repoRoot, fullPath)

    if (relativePath.split('/').some((part) => ignoredPathParts.has(part))) {
      continue
    }

    const stats = statSync(fullPath)
    if (stats.isDirectory()) {
      files.push(...collectRuntimeFiles(fullPath))
      continue
    }

    if (
      runtimeFilePattern.test(entry) &&
      !entry.endsWith('.bak') &&
      !entry.includes('.test.')
    ) {
      files.push(fullPath)
    }
  }

  return files
}

test('runtime AI paths do not depend on legacy Anthropic or Claude-only env vars', () => {
  const forbiddenPatterns = [
    /process\.env\.ANTHROPIC_API_KEY/,
    /process\.env\.CLAUDE_API_KEY/,
    /ANTHROPIC_API_KEY is not configured/,
    /CLAUDE_API_KEY/,
  ]

  const offenders = scanRoots
    .flatMap((root) => collectRuntimeFiles(join(repoRoot, root)))
    .flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8')
      return forbiddenPatterns
        .filter((pattern) => pattern.test(source))
        .map((pattern) => `${relative(repoRoot, filePath)} contains ${pattern}`)
    })

  assert.deepEqual(offenders, [])
})
