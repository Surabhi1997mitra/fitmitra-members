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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('=== VIDEO STATUS CHECK ===')
    const videoId = params.id

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
      return NextResponse.json({ error: 'Only admins can check video status' }, { status: 403 })
    }

    // Fetch video record
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single()

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    console.log('Video:', video.id, 'status:', video.status)

    // If video is already ready, return it
    if (video.status === 'ready' && video.mux_playback_id) {
      console.log('✓ Video already ready')
      return NextResponse.json(video, { status: 200 })
    }

    // Initialize Mux client
    const mux = new Mux({
      tokenId: muxTokenId!,
      tokenSecret: muxTokenSecret!,
    })

    let assetId = video.mux_asset_id

    // If we don't have asset_id yet, check the upload status
    if (!assetId && video.mux_upload_id) {
      console.log('Checking upload status...')
      const upload = await mux.video.uploads.retrieve(video.mux_upload_id)
      console.log('Upload status:', upload.status, 'asset_id:', upload.asset_id)

      if (upload.asset_id) {
        assetId = upload.asset_id
      } else if (upload.status === 'errored') {
        // Update status to errored
        await supabaseAdmin.from('videos').update({ status: 'errored' }).eq('id', videoId)
        return NextResponse.json({ error: 'Upload failed' }, { status: 400 })
      }
    }

    // If we have an asset ID, fetch its details
    if (assetId) {
      console.log('Fetching asset details:', assetId)
      const asset = await mux.video.assets.retrieve(assetId)
      console.log('Asset status:', asset.status)

      // Build update object
      const updateData: any = {
        mux_asset_id: assetId,
      }

      // Extract playback ID if available
      if (asset.playback_ids && asset.playback_ids.length > 0) {
        updateData.mux_playback_id = asset.playback_ids[0].id
      }

      // Set duration if available
      if (asset.duration) {
        updateData.duration = Math.round(asset.duration)
      }

      // Set thumbnail URL
      if (updateData.mux_playback_id) {
        updateData.thumbnail_url = `https://image.mux.com/${updateData.mux_playback_id}/thumbnail.jpg`
      }

      // Update status based on asset status
      if (asset.status === 'ready') {
        updateData.status = 'ready'
        console.log('✓ Asset is ready')
      } else if (asset.status === 'preparing') {
        updateData.status = 'processing'
        console.log('Asset still processing...')
      } else if (asset.status === 'errored') {
        updateData.status = 'errored'
        console.log('Asset errored')
      }

      // Update video record
      const { data: updatedVideo, error: updateError } = await supabaseAdmin
        .from('videos')
        .update(updateData)
        .eq('id', videoId)
        .select()
        .single()

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update video' }, { status: 400 })
      }

      console.log('✓ Video updated')
      return NextResponse.json(updatedVideo, { status: 200 })
    }

    // No asset yet, return current state
    return NextResponse.json(video, { status: 200 })
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
