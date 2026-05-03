import { createClient } from '@supabase/supabase-js'
import { jwtDecode } from 'jwt-decode'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface DecodedToken {
  sub?: string
  iss?: string
  aud?: string
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }

    // Verify admin via JWT
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    let decoded: DecodedToken
    try {
      decoded = jwtDecode<DecodedToken>(token)
    } catch {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.sub
    if (!userId) {
      return Response.json({ error: 'Invalid token structure' }, { status: 401 })
    }

    // Check if user is admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: adminProfile, error: adminError } = await adminClient
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (adminError || !adminProfile?.is_admin) {
      return Response.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Resend invite
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email)

    if (inviteError) {
      return Response.json({ error: inviteError.message || 'Failed to resend invite' }, { status: 400 })
    }

    return Response.json({ success: true, message: 'Invite resent successfully' })
  } catch (err) {
    console.error('Resend invite error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
