'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Home, Play, User, Search, X, Sun, Moon, Plus } from 'lucide-react'
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

export default function DashboardPage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [categories, setCategories] = useState<string[]>(['All'])
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredWorkouts, setFilteredWorkouts] = useState<Video[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    filterWorkouts()
  }, [searchQuery, selectedCategory, videos])

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUser({ ...session.user, id: session.user.id } as AuthUser)

    // Check if user is admin and fetch avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, avatar_url')
      .eq('id', session.user.id)
      .single()

    if (profile?.is_admin) {
      setIsAdmin(true)
    }

    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url)
    }

    await Promise.all([fetchCategories(), fetchVideos()])
    setLoading(false)
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .order('name', { ascending: true })

    if (!error && data) {
      setCategories(['All', ...data.map((c) => c.name)])
    }
  }

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('*, categories(name)')
      .eq('status', 'ready')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setVideos(data as Video[])
    }
  }

  const filterWorkouts = () => {
    let filtered = videos

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((v) => (v.categories as any)?.name === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter((v) =>
        v.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredWorkouts(filtered)
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return

    setAddingCategory(true)
    const { error } = await supabase.from('categories').insert({ name: newCategoryName.trim() })

    if (!error) {
      setNewCategoryName('')
      setShowAddCategory(false)
      await fetchCategories()
    }

    setAddingCategory(false)
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
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Welcome back!</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</p>
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
              placeholder="Search workouts..."
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

        {/* Category Filter Pills */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 items-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="px-4 py-2 rounded-full font-medium whitespace-nowrap transition"
              style={{
                backgroundColor: selectedCategory === category ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                color: selectedCategory === category ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {category}
            </button>
          ))}
          {isAdmin && (
            <button
              onClick={() => setShowAddCategory(!showAddCategory)}
              className="px-3 py-2 rounded-full transition flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-accent)',
              }}
              title="Add new category"
            >
              <Plus size={20} />
            </button>
          )}
          {showAddCategory && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                placeholder="New category"
                className="px-3 py-2 rounded-full text-sm focus:outline-none"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  borderWidth: '1px',
                  color: 'var(--color-text-primary)',
                }}
                autoFocus
              />
              <button
                onClick={handleAddCategory}
                disabled={addingCategory}
                className="px-3 py-2 rounded-full text-sm font-medium text-white transition disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Workouts Section */}
        <div id="workouts-section">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Workouts</h3>
          {filteredWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkouts.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className="rounded-lg overflow-hidden hover:transform hover:scale-105 transition duration-200 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  {/* Thumbnail */}
                  <div className="w-full aspect-video flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-card)' }}>
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
                  <div className="p-4">
                    <h4 className="font-semibold mb-2 line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                      {video.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Duration: {video.duration ? Math.round(video.duration / 60) + ' min' : 'N/A'}
                      </span>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: 'var(--color-badge)', color: 'var(--color-accent)' }}>
                        {(video.categories as any)?.name || 'Other'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🏋️</div>
              <p className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                No workouts here yet
              </p>
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="inline-block px-4 py-2 rounded-lg text-white font-medium transition"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  + Add Video
                </Link>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  Check back soon!
                </p>
              )}
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
          <button
            onClick={() => document.getElementById('workouts-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Play size={24} />
            <span className="text-xs mt-1 font-medium">Workouts</span>
          </button>
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
    </div>
  )
}
