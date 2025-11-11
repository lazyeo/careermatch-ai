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
