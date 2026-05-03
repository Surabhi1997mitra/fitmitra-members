import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Only check access expiry on these routes
  const protectedRoutes = ['/dashboard', '/workouts', '/recipes', '/profile']
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // Get the session from the request
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.next()
    }

    // Fetch user's profile to check access expiry
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_active, access_expires_at')
      .eq('id', session.user.id)
      .single()

    if (error || !profile) {
      return NextResponse.next()
    }

    const now = new Date()
    const expiresAt = new Date(profile.access_expires_at)
    const isExpired = expiresAt < now
    const isInactive = !profile.is_active

    if (isExpired || isInactive) {
      return NextResponse.redirect(new URL('/access-expired', request.url))
    }

    return NextResponse.next()
  } catch (err) {
    console.error('Middleware error:', err)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
