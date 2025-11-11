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
    const {
      title,
      company,
      location,
      job_type,
      salary_min,
      salary_max,
      salary_currency,
      description,
      requirements,
      benefits,
      source_url,
      posted_date,
      deadline,
      status,
    } = body

    // Validate required fields
    if (!title || !company) {
      return NextResponse.json(
        { error: 'Title and company are required' },
        { status: 400 }
      )
    }

    // Create the job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: user.id,
        title,
        company,
        location: location || null,
        job_type: job_type || null,
        salary_min: salary_min || null,
        salary_max: salary_max || null,
        salary_currency: salary_currency || 'NZD',
        description: description || null,
        requirements: requirements || null,
        benefits: benefits || null,
        source_url: source_url || null,
        posted_date: posted_date || null,
        deadline: deadline || null,
        status: status || 'saved',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating job:', error)
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      )
    }

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user's jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error in GET /api/jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
