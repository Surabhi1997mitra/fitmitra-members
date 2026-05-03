'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Home, Play, User, Search, X, Sun, Moon, Plus, UtensilsCrossed } from 'lucide-react'
import MuxPlayer from '@mux/mux-player-react'

interface AuthUser {
  email?: string
  id?: string
}

interface Video {
  id: string
  title: string
  description?: string
  mux_playback_id?: string
  thumbnail_url?: string
  duration?: number
  categories?: { name: string }
  category_id?: string
  status?: string
}

interface Recipe {
  id: string
  title: string
  description?: string
  category: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  ingredients?: string[]
  instructions?: string[]
  image_url?: string
  tags?: string[]
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [firstName, setFirstName] = useState('')
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [profileCompleted, setProfileCompleted] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    filterContent()
  }, [searchQuery, videos, recipes])

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUser({ ...session.user, id: session.user.id } as AuthUser)

    // Check if user is admin and fetch avatar and name
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, avatar_url, full_name, email')
      .eq('id', session.user.id)
      .single()

    if (profile?.is_admin) {
      setIsAdmin(true)
    }

    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url)
    }

    if (profile?.full_name) {
      setFirstName(profile.full_name.split(' ')[0])
    } else if (profile?.email) {
      setFirstName(profile.email.split('@')[0])
    }

    // Check if profile is completed (only for non-admin users)
    if (!profile?.is_admin) {
      const { data: clientProfile } = await supabase
        .from('client_profile')
        .select('completed')
        .eq('user_id', session.user.id)
        .single()

      if (clientProfile?.completed) {
        setProfileCompleted(true)
      } else {
        // Check if user has skipped profile setup before
        const skipped = localStorage.getItem(`profile_setup_skipped_${session.user.id}`)
        if (!skipped) {
          setShowProfileSetup(true)
        }
      }
    }

    await Promise.all([fetchVideos(), fetchRecipes()])
    setLoading(false)
  }

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*, categories(name)')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setVideos(data as Video[])
    }
  }

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setRecipes(data as Recipe[])
    }
  }

  const filterContent = () => {
    let filteredVids = videos
    let filteredRecs = recipes

    if (searchQuery) {
      filteredVids = filteredVids.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      filteredRecs = filteredRecs.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredVideos(filteredVids)
    setFilteredRecipes(filteredRecs)
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await supabase.auth.signOut()
    router.push('/login')
  }


  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: 'var(--color-bg-primary)', borderBottomColor: 'var(--color-border)', borderBottomWidth: '1px' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              <span style={{ color: 'var(--color-text-primary)' }}>Fit</span>
              <span style={{ color: 'var(--color-accent)' }}>Mitra</span>
            </h1>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : user?.email ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {user.email[0].toUpperCase()}
              </div>
            ) : null}
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-2 rounded-lg transition text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-accent)',
                  color: 'white',
                }}
              >
                Admin
              </Link>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 transition p-2 rounded-lg"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Welcome back, {firstName}!
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Ready to train today?</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search workouts or recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 transition"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                borderWidth: '1px',
                color: 'var(--color-text-primary)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 transition"
                style={{
                  color: 'var(--color-text-secondary)',
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Workouts Section */}
        <div id="workouts-section" className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Workouts</h3>
            <Link
              href="/workouts"
              className="text-sm font-medium transition"
              style={{ color: 'var(--color-accent)' }}
            >
              See All →
            </Link>
          </div>
          {filteredVideos.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="flex-none w-[70vw] sm:w-72 snap-start rounded-lg overflow-hidden hover:opacity-80 transition cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  {/* Thumbnail */}
                  <div className="w-full h-40 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Play size={48} style={{ color: 'var(--color-accent)', opacity: 0.3 }} />
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-3">
                    <h4 className="font-semibold line-clamp-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {video.title}
                    </h4>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {video.duration ? Math.round(video.duration / 60) + ' min' : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: 'var(--color-text-secondary)' }}>No workouts yet</p>
            </div>
          )}
        </div>

        {/* Recipes Section */}
        <div id="recipes-section">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Nutrition</h3>
            <Link
              href="/recipes"
              className="text-sm font-medium transition"
              style={{ color: 'var(--color-accent)' }}
            >
              See All →
            </Link>
          </div>
          {filteredRecipes.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  onClick={() => router.push(`/recipes/${recipe.id}`)}
                  className="flex-none w-[70vw] sm:w-72 snap-start rounded-lg overflow-hidden hover:opacity-80 transition cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  {/* Recipe Image or Emoji */}
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center text-4xl" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                      🥗
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-3">
                    <span
                      className="inline-block px-2 py-1 rounded text-xs font-semibold mb-2"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                    >
                      {recipe.category}
                    </span>
                    <h4 className="font-semibold line-clamp-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {recipe.title}
                    </h4>
                    {recipe.calories && (
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {recipe.calories} cal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p style={{ color: 'var(--color-text-secondary)' }}>No recipes yet</p>
            </div>
          )}
        </div>

        {/* Video Player Modal */}
        {selectedVideo && selectedVideo.mux_playback_id && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
            onClick={() => setSelectedVideo(null)}
          >
            <div
              className="relative w-full max-w-4xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute -top-12 right-0 transition"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X size={32} />
              </button>
              <div className="w-full bg-black rounded-lg overflow-hidden">
                <MuxPlayer
                  playbackId={selectedVideo.mux_playback_id}
                  streamType="on-demand"
                  autoPlay
                />
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  {selectedVideo.title}
                </h2>
                {selectedVideo.description && (
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedVideo.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0" style={{ backgroundColor: 'var(--color-bg-secondary)', borderTopColor: 'var(--color-border)', borderTopWidth: '1px' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-around">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-accent)' }}
          >
            <Home size={24} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          <Link
            href="/workouts"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Play size={24} />
            <span className="text-xs mt-1 font-medium">Workouts</span>
          </Link>
          <Link
            href="/recipes"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <UtensilsCrossed size={24} />
            <span className="text-xs mt-1 font-medium">Recipes</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <User size={24} />
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="p-6 rounded-xl max-w-sm w-full"
            style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Are you sure you want to logout?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg transition"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  borderWidth: '1px',
                  color: 'var(--color-text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* First Time Login - Profile Setup Overlay */}
      {showProfileSetup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        >
          <div className="max-w-md w-full text-center">
            <h1 className="text-4xl font-bold mb-4">
              <span style={{ color: 'var(--color-text-primary)' }}>Fit</span>
              <span style={{ color: 'var(--color-accent)' }}>Mitra</span>
            </h1>
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Welcome to FitMitra! 👋
            </h2>
            <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
              Before you explore, let's set up your profile. It helps your coach personalise everything for you.
            </p>
            <button
              onClick={() => {
                setShowProfileSetup(false)
                router.push('/profile')
              }}
              className="w-full px-6 py-3 rounded-lg text-white font-semibold mb-4 transition text-lg"
              style={{ backgroundColor: 'var(--color-accent)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-accent)'
              }}
            >
              Set Up My Profile →
            </button>
            <button
              onClick={() => {
                setShowProfileSetup(false)
                if (user?.id) {
                  localStorage.setItem(`profile_setup_skipped_${user.id}`, 'true')
                }
              }}
              className="text-sm transition"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
