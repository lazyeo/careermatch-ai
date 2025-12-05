import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase-server'
import { Button } from '@careermatch/ui'

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-primary-600">CareerMatch AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your intelligent job search partner for the New Zealand market
          </p>
          <div className="flex justify-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" size="lg">
                  进入仪表盘
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button variant="primary" size="lg">
                    免费注册
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    登录
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white p-6 rounded-xl shadow-soft">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Resume Builder</h3>
            <p className="text-gray-600">Create and optimize your resume with AI-powered suggestions tailored to each job.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-soft">
            <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">AI Job Matching</h3>
            <p className="text-gray-600">Get intelligent 9-dimension analysis to find your perfect job match.</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-soft">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Tracking</h3>
            <p className="text-gray-600">Track your applications, interviews, and progress in one organized dashboard.</p>
          </div>
        </div>

        {/* Extension Download Section */}
        <div className="mt-20 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="p-8 md:p-12">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
                🚀 浏览器插件
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                随时随地获取 AI 职场助手支持
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                安装 CareerMatch AI 浏览器插件，在 Seek、LinkedIn 等招聘网站上直接获取岗位分析和简历建议。一键导入岗位，无缝对接您的求职工作流。
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="primary" size="lg" className="gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  下载 Chrome 插件
                </Button>
                <Button variant="outline" size="lg">
                  了解更多
                </Button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-full min-h-[300px] flex items-center justify-center p-8">
              {/* Placeholder for extension screenshot/preview */}
              <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-2 mb-4 border-b pb-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <div className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded flex-1">seek.com.au/job/123456</div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  <div className="h-32 bg-primary-50 rounded border border-primary-100 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
                      <div className="text-xs font-medium text-primary-700">CareerMatch AI 分析中...</div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-primary-200 rounded w-full"></div>
                      <div className="h-2 bg-primary-200 rounded w-5/6"></div>
                      <div className="h-2 bg-primary-200 rounded w-4/6"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500">
            🚀 Development in progress - MVP Phase
          </p>
        </div>
      </div>
    </main>
  )
}
