import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, content, template_id } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Create the resume
    const { data: resume, error } = await supabase
      .from('resumes')
      .insert({
        user_id: user.id,
        title,
        content,
        template_id: template_id || null,
        version: 1,
        is_primary: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating resume:', error)
      return NextResponse.json(
        { error: 'Failed to create resume' },
        { status: 500 }
      )
    }

    return NextResponse.json(resume, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/resumes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user's resumes
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching resumes:', error)
      return NextResponse.json(
        { error: 'Failed to fetch resumes' },
        { status: 500 }
      )
    }

    return NextResponse.json(resumes)
  } catch (error) {
    console.error('Error in GET /api/resumes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
