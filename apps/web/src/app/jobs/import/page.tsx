import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { JobImportForm } from '../components/JobImportForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'

export default async function ImportJobPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/import')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">智能导入岗位</h1>
              <p className="text-sm text-gray-600 mt-1">
                粘贴招聘链接或内容，AI自动提取岗位信息
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/jobs/new">
                <Button variant="outline">手动创建</Button>
              </Link>
              <Link href="/jobs">
                <Button variant="outline">返回列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobImportForm />
      </main>
    </div>
  )
}
