import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { JobForm } from '../components/JobForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'

export default async function NewJobPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/new')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">添加岗位</h1>
              <p className="text-sm text-gray-600 mt-1">
                保存您感兴趣的岗位信息，开始智能匹配分析
              </p>
            </div>
            <Link href="/jobs">
              <Button variant="outline">返回列表</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobForm mode="create" />
      </main>
    </div>
  )
}
