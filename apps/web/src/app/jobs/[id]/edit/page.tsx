import { redirect, notFound } from 'next/navigation'
import { getCurrentUser, createClient } from '@/lib/supabase-server'
import { JobForm } from '../../components/JobForm'
import Link from 'next/link'
import { Button } from '@careermatch/ui'

export default async function EditJobPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login?redirect=/jobs/' + params.id + '/edit')
  }

  const supabase = await createClient()

  // Fetch the job
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !job) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">编辑岗位</h1>
              <p className="text-sm text-gray-600 mt-1">
                修改岗位信息和状态
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/jobs/${params.id}`}>
                <Button variant="outline">查看详情</Button>
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
        <JobForm
          mode="edit"
          initialData={{
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            job_type: job.job_type,
            salary_min: job.salary_min,
            salary_max: job.salary_max,
            salary_currency: job.salary_currency || 'NZD',
            description: job.description,
            requirements: job.requirements,
            benefits: job.benefits,
            source_url: job.source_url,
            posted_date: job.posted_date,
            deadline: job.deadline,
            status: job.status,
          }}
        />
      </main>
    </div>
  )
}
