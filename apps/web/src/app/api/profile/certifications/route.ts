import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserCertificationInput } from '@careermatch/shared'

/**
 * POST /api/profile/certifications
 * 创建证书
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UserCertificationInput = await request.json()

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Certification name is required' },
        { status: 400 }
      )
    }

    if (!body.issuer?.trim()) {
      return NextResponse.json(
        { error: 'Issuer is required' },
        { status: 400 }
      )
    }

    if (!body.issue_date) {
      return NextResponse.json(
        { error: 'Issue date is required' },
        { status: 400 }
      )
    }

    // 获取当前最大display_order
    const { data: maxOrderData } = await supabase
      .from('user_certifications')
      .select('display_order')
      .eq('user_id', user.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.display_order || 0) + 1

    const { data: certification, error } = await supabase
      .from('user_certifications')
      .insert({
        user_id: user.id,
        name: body.name,
        issuer: body.issuer,
        issue_date: body.issue_date,
        expiry_date: body.expiry_date,
        credential_id: body.credential_id,
        credential_url: body.credential_url,
        display_order: body.display_order ?? nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating certification:', error)
      return NextResponse.json(
        { error: 'Failed to create certification' },
        { status: 500 }
      )
    }

    return NextResponse.json(certification, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/profile/certifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/profile/certifications
 * 获取所有证书
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: certifications, error } = await supabase
      .from('user_certifications')
      .select('*')
      .eq('user_id', user.id)
      .order('display_order')
      .order('issue_date', { ascending: false })

    if (error) {
      console.error('Error fetching certifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch certifications' },
        { status: 500 }
      )
    }

    return NextResponse.json(certifications)
  } catch (error) {
    console.error('Error in GET /api/profile/certifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
