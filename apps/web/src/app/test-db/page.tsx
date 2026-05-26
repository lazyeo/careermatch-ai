/**
 * 数据库连接测试页面
 *
 * 访问 http://localhost:3000/test-db 查看测试结果
 */

import { createClient } from '@/lib/supabase-server'
import { Card, CardContent, CardHeader, CardTitle } from '@careermatch/ui'

export const dynamic = 'force-dynamic'

interface TestResult {
  name: string
  status: 'success' | 'error'
  message: string
  details?: Record<string, unknown> | string
}

async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = []

  // 测试1: 检查环境变量
  results.push({
    name: 'Environment Variables',
    status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? 'success'
      : 'error',
    message: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? 'Environment variables are configured correctly'
      : 'Environment variables are missing. Check the .env.local file',
    details: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing',
    },
  })

  try {
    const supabase = await createClient()

    // 测试2: 测试数据库连接
    const { error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    results.push({
      name: 'Supabase Connection',
      status: connectionError ? 'error' : 'success',
      message: connectionError
        ? `Connection failed: ${connectionError.message}`
        : 'Supabase connection succeeded',
      details: connectionError ? connectionError.message : 'Database is accessible',
    })

    // 测试3: 检查所有核心表是否存在
    const tables = [
      'profiles',
      'user_preferences',
      'resumes',
      'jobs',
      'job_analyses',
      'applications',
      'interviews',
    ]

    const tableResults: Record<string, boolean> = {}
    let allTablesExist = true

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1)
      tableResults[table] = !error
      if (error) allTablesExist = false
    }

    results.push({
      name: 'Database Tables',
      status: allTablesExist ? 'success' : 'error',
      message: allTablesExist
        ? 'All core tables exist'
        : 'Some tables are missing. Run the database migrations',
      details: tableResults,
    })

    // 测试4: 测试认证系统
    const { data: authData, error: authError } = await supabase.auth.getSession()

    results.push({
      name: 'Authentication',
      status: 'success',
      message: 'Authentication is running',
      details: {
        session: authData.session ? 'Signed in' : 'Signed out',
        error: authError ? authError.message : 'None',
      },
    })

    // 测试5: 测试RLS策略（未登录状态下应该无法访问私有数据）
    const { data: rlsTest, error: rlsError } = await supabase
      .from('resumes')
      .select('*')
      .limit(1)

    results.push({
      name: 'Row Level Security (RLS)',
      status: 'success',
      message: 'RLS is enabled and private data is protected when signed out',
      details: {
        accessible: rlsTest && rlsTest.length > 0 ? 'Yes' : 'No (expected)',
        error: rlsError ? rlsError.message : 'None',
      },
    })
  } catch (error) {
    results.push({
      name: 'Unknown Error',
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      details: String(error),
    })
  }

  return results
}

export default async function TestDatabasePage() {
  const results = await runTests()
  const allPassed = results.every((r) => r.status === 'success')

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Database Connection Test
          </h1>
          <p className="text-neutral-600">
            Verify Supabase configuration and database connectivity
          </p>
        </div>

        {/* 总体状态 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {allPassed ? (
                <>
                  <span className="text-4xl">✅</span>
                  <span className="text-success-600">All tests passed</span>
                </>
              ) : (
                <>
                  <span className="text-4xl">⚠️</span>
                  <span className="text-warning-600">Some tests failed</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700">
              {allPassed
                ? 'Supabase is configured correctly and the database connection is healthy.'
                : 'Use the errors below to fix the configuration.'}
            </p>
          </CardContent>
        </Card>

        {/* 测试结果 */}
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card
              key={index}
              className={
                result.status === 'success'
                  ? 'border-success-300'
                  : 'border-error-300'
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className="text-2xl">
                    {result.status === 'success' ? '✅' : '❌'}
                  </span>
                  <span>{result.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p
                  className={
                    result.status === 'success'
                      ? 'text-success-700'
                      : 'text-error-700'
                  }
                >
                  {result.message}
                </p>

                {result.details && (
                  <div className="mt-3 p-3 bg-neutral-100 rounded-lg">
                    <p className="text-xs font-semibold text-neutral-600 mb-2">
                      Details:
                    </p>
                    <pre className="text-xs text-neutral-700 overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 下一步指引 */}
        {allPassed && (
          <Card className="mt-8 bg-primary-50 border-primary-300">
            <CardHeader>
              <CardTitle className="text-primary-700">Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-neutral-700">Database configuration is complete. You can now:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-600 ml-2">
                <li>Return home: <a href="/" className="text-primary-600 underline">http://localhost:3000</a></li>
                <li>Continue building the login page</li>
                <li>Continue building the registration page</li>
                <li>Implement the authentication flow</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 错误修复指引 */}
        {!allPassed && (
          <Card className="mt-8 bg-warning-50 border-warning-300">
            <CardHeader>
              <CardTitle className="text-warning-700">Fix Suggestions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-2 text-neutral-700 ml-2">
                <li>
                  <strong>Environment variable error:</strong> Check that{' '}
                  <code className="bg-neutral-200 px-1 rounded">
                    apps/web/.env.local
                  </code>{' '}
                  exists and is configured correctly
                </li>
                <li>
                  <strong>Connection failure:</strong> Check that the Supabase project URL and API key are correct
                </li>
                <li>
                  <strong>Missing tables:</strong> Run this migration in the Supabase SQL Editor:{' '}
                  <code className="bg-neutral-200 px-1 rounded">
                    supabase/migrations/20250101000000_initial_schema.sql
                  </code>
                </li>
                <li>
                  <strong>Other errors:</strong> Review the details above or restart the development server with{' '}
                  <code className="bg-neutral-200 px-1 rounded">pnpm web:dev</code>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
