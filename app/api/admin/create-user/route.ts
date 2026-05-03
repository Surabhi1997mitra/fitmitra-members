import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

interface CreateUserRequest {
  email: string
  accessDuration: number
}

interface JWTPayload {
  sub: string
  [key: string]: any
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.error('Invalid JWT format - expected 3 parts')
      return null
    }

    const payload = parts[1]
    const decoded = Buffer.from(payload, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch (error) {
    console.error('Failed to decode JWT:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE USER API ROUTE CALLED ===')
    console.log('Environment check:')
    console.log('- supabaseUrl:', supabaseUrl ? 'set' : 'MISSING')
    console.log('- supabaseServiceRoleKey:', supabaseServiceRoleKey ? 'set' : 'MISSING')

    // Get the caller's authorization token
    const authHeader = request.headers.get('authorization')
    console.log('Auth header present:', !!authHeader)
    console.log('Auth header value:', authHeader ? `${authHeader.substring(0, 30)}...` : 'MISSING')

    if (!authHeader) {
      console.error('No authorization header provided')
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '')
    console.log('Token extracted, length:', token.length)

    // Decode JWT to get user ID
    console.log('Decoding JWT token...')
    const payload = decodeJWT(token)
    console.log('Decoded payload - sub:', payload?.sub)

    if (!payload?.sub) {
      console.error('Invalid token - no subject (sub) claim')
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      )
    }

    const currentUserId = payload.sub
    console.log('✓ User ID extracted from token:', currentUserId)

    // Create admin client with service role key for admin operations
    console.log('Creating supabaseAdmin client with service role key...')
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if current user is admin
    console.log('Checking if user is admin...')
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', currentUserId)
      .single()

    console.log('Profile fetch - error:', profileError, 'data:', profile, 'is_admin:', profile?.is_admin)

    if (profileError || !profile?.is_admin) {
      console.error('❌ User is not admin or profile error')
      return NextResponse.json(
        { error: 'Only admins can create users', details: profileError?.message },
        { status: 403 }
      )
    }

    console.log('✓ User is admin, proceeding...')

    // Parse request body
    console.log('Parsing request body...')
    const body: CreateUserRequest = await request.json()
    console.log('Request body:', body)
    const { email, accessDuration } = body

    if (!email || !accessDuration) {
      console.error('Missing required fields - email:', email, 'accessDuration:', accessDuration)
      return NextResponse.json(
        { error: 'Missing required fields: email, accessDuration' },
        { status: 400 }
      )
    }

    console.log('✓ Request valid - email:', email, 'duration:', accessDuration, 'days')

    // Send invitation email - user will set their own password via link
    console.log('Calling inviteUserByEmail()...')
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

    console.log('Invite response - error:', inviteError, 'userId:', inviteData?.user?.id)

    if (inviteError || !inviteData?.user) {
      console.error('❌ Invite failed:', inviteError)
      return NextResponse.json(
        { error: inviteError?.message || 'Failed to send invite' },
        { status: 400 }
      )
    }

    console.log('✓ Invite sent to:', inviteData.user.id)

    // Calculate access expiry date
    const now = new Date()
    const accessExpiry = new Date(now.getTime() + accessDuration * 24 * 60 * 60 * 1000)
    console.log('Access expiry set to:', accessExpiry.toISOString())

    // Insert profile record for the invited user
    console.log('Creating profile record...')
    const { data: newProfile, error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: inviteData.user.id,
        email,
        is_admin: false,
        is_active: true,
        access_expires_at: accessExpiry.toISOString(),
      })
      .select()
      .single()

    console.log('Profile insert response - error:', profileCreateError, 'profile:', newProfile)

    if (profileCreateError) {
      console.error('❌ Profile creation failed:', profileCreateError)
      // Clean up: delete the auth user since profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(inviteData.user.id)
      return NextResponse.json(
        { error: 'Failed to create profile: ' + profileCreateError.message },
        { status: 400 }
      )
    }

    console.log('✓✓✓ SUCCESS - Invite sent and profile created')
    return NextResponse.json(
      {
        user: inviteData.user,
        profile: newProfile,
        message: `Invite sent to ${email}. They will receive an email to set up their account.`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Caught exception:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }

  console.log('=== API ROUTE COMPLETED ===')
}
