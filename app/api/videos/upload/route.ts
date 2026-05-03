import { createClient } from '@supabase/supabase-js'
import Mux from '@mux/mux-node'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const muxTokenId = process.env.MUX_TOKEN_ID
const muxTokenSecret = process.env.MUX_TOKEN_SECRET

if (!supabaseUrl || !supabaseServiceRoleKey || !muxTokenId || !muxTokenSecret) {
  throw new Error('Missing required environment variables')
}

interface JWTPayload {
  sub: string
  [key: string]: any
}

function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
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
    console.log('=== VIDEO UPLOAD API ===')

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Extract and decode token
    const token = authHeader.replace('Bearer ', '')
    const payload = decodeJWT(token)
    if (!payload?.sub) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }

    const userId = payload.sub
    console.log('User ID:', userId)

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.is_admin) {
      console.error('Not admin:', profileError)
      return NextResponse.json({ error: 'Only admins can upload videos' }, { status: 403 })
    }

    console.log('✓ User is admin')

    // Parse request body
    const body = await request.json()
    const { title, description, category_id, tags } = body

    if (!title || !category_id) {
      return NextResponse.json({ error: 'Missing required fields: title, category_id' }, { status: 400 })
    }

    console.log('Creating Mux upload URL...')

    // Create Mux direct upload URL
    const mux = new Mux({
      tokenId: muxTokenId!,
      tokenSecret: muxTokenSecret!,
    })

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],
      },
      cors_origin: '*',
    })

    console.log('✓ Mux upload created:', upload.id)

    // Insert video record to Supabase
    const { data: videoRow, error: insertError } = await supabaseAdmin
      .from('videos')
      .insert({
        title,
        description: description || null,
        category_id,
        tags: tags || [],
        mux_upload_id: upload.id,
        status: 'uploading',
      })
      .select()
      .single()

    if (insertError || !videoRow) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create video record' }, { status: 400 })
    }

    console.log('✓ Video record created:', videoRow.id)

    return NextResponse.json(
      {
        uploadUrl: upload.url,
        videoId: videoRow.id,
        message: 'Upload URL created. Upload your video directly to the URL.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
