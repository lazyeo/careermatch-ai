import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { ResumePreview } from './ResumePreview'

export default async function ResumePreviewPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/resumes/preview/' + params.id)
  }

  // Fetch resume
  const { data: resume, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !resume) {
    redirect('/resumes')
  }

  return <ResumePreview resume={resume} />
}
