import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import type { UserCertificationInput } from '@careermatch/shared'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/profile/certifications/[id]
 * 获取单个证书
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: certification, error } = await supabase
      .from('user_certifications')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Certification not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching certification:', error)
      return NextResponse.json(
        { error: 'Failed to fetch certification' },
        { status: 500 }
      )
    }

    return NextResponse.json(certification)
  } catch (error) {
    console.error('Error in GET /api/profile/certifications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/profile/certifications/[id]
 * 更新证书
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: Partial<UserCertificationInput> = await request.json()

    const { data: certification, error } = await supabase
      .from('user_certifications')
      .update({
        name: body.name,
        issuer: body.issuer,
        issue_date: body.issue_date,
        expiry_date: body.expiry_date,
        credential_id: body.credential_id,
        credential_url: body.credential_url,
        display_order: body.display_order,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Certification not found' },
          { status: 404 }
        )
      }
      console.error('Error updating certification:', error)
      return NextResponse.json(
        { error: 'Failed to update certification' },
        { status: 500 }
      )
    }

    return NextResponse.json(certification)
  } catch (error) {
    console.error('Error in PUT /api/profile/certifications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/profile/certifications/[id]
 * 删除证书
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('user_certifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting certification:', error)
      return NextResponse.json(
        { error: 'Failed to delete certification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/profile/certifications/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
