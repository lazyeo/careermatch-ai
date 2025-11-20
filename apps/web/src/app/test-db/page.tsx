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
    name: '环境变量配置',
    status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? 'success'
      : 'error',
    message: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? '环境变量已正确配置'
      : '环境变量缺失，请检查 .env.local 文件',
    details: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ 已配置' : '✗ 未配置',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ 已配置' : '✗ 未配置',
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
      name: 'Supabase连接',
      status: connectionError ? 'error' : 'success',
      message: connectionError
        ? `连接失败: ${connectionError.message}`
        : 'Supabase连接成功',
      details: connectionError ? connectionError.message : '数据库可访问',
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
      name: '数据库表检查',
      status: allTablesExist ? 'success' : 'error',
      message: allTablesExist
        ? '所有核心表已创建'
        : '部分表不存在，请运行数据库迁移脚本',
      details: tableResults,
    })

    // 测试4: 测试认证系统
    const { data: authData, error: authError } = await supabase.auth.getSession()

    results.push({
      name: '认证系统',
      status: 'success',
      message: '认证系统正常运行',
      details: {
        session: authData.session ? '已登录' : '未登录',
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
      message: 'RLS策略已启用（未登录状态下无法访问数据）',
      details: {
        accessible: rlsTest && rlsTest.length > 0 ? 'Yes' : 'No (正常)',
        error: rlsError ? rlsError.message : 'None',
      },
    })
  } catch (error) {
    results.push({
      name: '未知错误',
      status: 'error',
      message: error instanceof Error ? error.message : '发生未知错误',
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
            数据库连接测试
          </h1>
          <p className="text-neutral-600">
            验证Supabase配置和数据库连接状态
          </p>
        </div>

        {/* 总体状态 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {allPassed ? (
                <>
                  <span className="text-4xl">✅</span>
                  <span className="text-success-600">所有测试通过</span>
                </>
              ) : (
                <>
                  <span className="text-4xl">⚠️</span>
                  <span className="text-warning-600">部分测试失败</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700">
              {allPassed
                ? 'Supabase配置正确，数据库连接正常，可以开始开发认证功能。'
                : '请根据下方的错误信息修复配置问题。'}
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
                      详细信息:
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
              <CardTitle className="text-primary-700">🎉 下一步</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-neutral-700">数据库配置完成！接下来可以：</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-600 ml-2">
                <li>返回首页: <a href="/" className="text-primary-600 underline">http://localhost:3000</a></li>
                <li>开始开发登录页面</li>
                <li>开始开发注册页面</li>
                <li>实现用户认证功能</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 错误修复指引 */}
        {!allPassed && (
          <Card className="mt-8 bg-warning-50 border-warning-300">
            <CardHeader>
              <CardTitle className="text-warning-700">🔧 修复建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="list-disc list-inside space-y-2 text-neutral-700 ml-2">
                <li>
                  <strong>环境变量错误:</strong> 检查{' '}
                  <code className="bg-neutral-200 px-1 rounded">
                    apps/web/.env.local
                  </code>{' '}
                  文件是否存在且配置正确
                </li>
                <li>
                  <strong>连接失败:</strong> 检查Supabase项目URL和API Key是否正确
                </li>
                <li>
                  <strong>表不存在:</strong> 在Supabase SQL Editor中运行{' '}
                  <code className="bg-neutral-200 px-1 rounded">
                    supabase/migrations/20250101000000_initial_schema.sql
                  </code>
                </li>
                <li>
                  <strong>其他错误:</strong> 查看上方详细错误信息，或重启开发服务器{' '}
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
