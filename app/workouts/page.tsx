'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Sun, Moon, Home, Play, UtensilsCrossed, User, Search } from 'lucide-react'
import MuxPlayer from '@mux/mux-player-react'

interface Category {
  id: string
  name: string
}

interface Video {
  id: string
  title: string
  description?: string
  category_id: string
  categories: Category
  mux_playback_id?: string
  thumbnail_url?: string
  status: string
  duration?: number
  created_at: string
}

export default function WorkoutsPage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()
  const [videos, setVideos] = useState<Video[]>([])
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const [videosRes, categoriesRes] = await Promise.all([
        supabase
          .from('videos')
          .select('*, categories(id, name)')
          .eq('status', 'ready')
          .order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ])

      if (!videosRes.error && videosRes.data) {
        setVideos(videosRes.data as Video[])
        setFilteredVideos(videosRes.data as Video[])
      }

      if (!categoriesRes.error && categoriesRes.data) {
        setCategories(categoriesRes.data as Category[])
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = videos

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((video) => video.categories.name === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter((video) =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredVideos(filtered)
  }, [selectedCategory, searchQuery, videos])

  const handleLogout = async () => {
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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" style={{ color: 'var(--color-text-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
            FitMitra
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
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

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm mx-4" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <p className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Are you sure?
            </p>
            <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              You will be logged out of FitMitra.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg transition"
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  color: 'var(--color-text-primary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg transition text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="w-full max-w-4xl">
            <button
              onClick={() => setSelectedVideo(null)}
              className="mb-4 text-white text-xl font-bold"
            >
              ✕ Close
            </button>
            {selectedVideo.mux_playback_id && (
              <MuxPlayer
                playbackId={selectedVideo.mux_playback_id}
                title={selectedVideo.title}
                className="w-full"
              />
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
          Workouts
        </h1>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search size={20} className="absolute left-3 top-3" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Search workouts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border transition"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Category Pills */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedCategory('All')}
            className="flex-none px-4 py-2 rounded-full transition whitespace-nowrap text-sm font-medium snap-start"
            style={{
              backgroundColor: selectedCategory === 'All' ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
              color: selectedCategory === 'All' ? 'white' : 'var(--color-text-secondary)',
            }}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className="flex-none px-4 py-2 rounded-full transition whitespace-nowrap text-sm font-medium snap-start"
              style={{
                backgroundColor: selectedCategory === category.name ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                color: selectedCategory === category.name ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video)}
                className="rounded-xl overflow-hidden cursor-pointer transition hover:opacity-80"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                {/* Thumbnail */}
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-5xl" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                    🎥
                  </div>
                )}

                {/* Card Content */}
                <div className="p-4">
                  {/* Category Badge */}
                  <span
                    className="inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                  >
                    {video.categories.name}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg font-bold line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                    {video.title}
                  </h3>

                  {/* Duration */}
                  {video.duration && (
                    <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                      {Math.round(video.duration / 60)} min
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              No workouts found
            </p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0" style={{ backgroundColor: 'var(--color-bg-secondary)', borderTopColor: 'var(--color-border)', borderTopWidth: '1px' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-around">
          <Link
            href="/dashboard"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Home size={24} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link
            href="/workouts"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-accent)' }}
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
    </div>
  )
}
