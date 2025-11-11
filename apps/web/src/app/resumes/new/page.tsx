import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { ResumeForm } from '../components/ResumeForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'

export default async function NewResumePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/resumes/new')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">创建新简历</h1>
              <p className="text-sm text-gray-600 mt-1">
                填写您的个人信息和工作经历，创建专业的简历
              </p>
            </div>
            <Link href="/resumes">
              <Button variant="outline">返回列表</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResumeForm mode="create" />
      </main>
    </div>
  )
}
