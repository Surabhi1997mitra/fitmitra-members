'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Home, Play, User, Search, X, Sun, Moon } from 'lucide-react'

interface User {
  email?: string
}

const CATEGORIES = ['All', 'Shoulders', 'Legs', 'Back', 'Chest', 'Core']

const DUMMY_WORKOUTS = [
  { id: 1, title: 'Shoulder Press Basics', category: 'Shoulders' },
  { id: 2, title: 'Leg Day Essentials', category: 'Legs' },
  { id: 3, title: 'Back Strength Training', category: 'Back' },
  { id: 4, title: 'Chest Workout Series', category: 'Chest' },
  { id: 5, title: 'Core Stability Work', category: 'Core' },
  { id: 6, title: 'Full Body Stretch', category: 'Shoulders' },
]

export default function DashboardPage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [filteredWorkouts, setFilteredWorkouts] = useState(DUMMY_WORKOUTS)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    filterWorkouts()
  }, [searchQuery, selectedCategory])

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      router.push('/login')
      return
    }

    setUser(session.user as User)
    setLoading(false)
  }

  const filterWorkouts = () => {
    let filtered = DUMMY_WORKOUTS

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((w) => w.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter((w) =>
        w.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredWorkouts(filtered)
  }

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span style={{ color: 'var(--color-text-primary)' }}>Fit</span>
            <span style={{ color: 'var(--color-accent)' }}>Mitra</span>
          </h1>
          <div className="flex items-center gap-4">
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
              onClick={handleLogout}
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
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
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
        </div>

        {/* Workouts Section */}
        <div>
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Workouts</h3>
          {filteredWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="rounded-lg overflow-hidden hover:transform hover:scale-105 transition duration-200 cursor-pointer"
                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  {/* Thumbnail Placeholder */}
                  <div className="w-full aspect-video flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-card)' }}>
                    <Play size={48} style={{ color: 'var(--color-accent)', opacity: 0.3 }} />
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <h4 className="font-semibold mb-2 line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                      {workout.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Duration: 20 min
                      </span>
                      <span className="px-3 py-1 text-xs font-semibold rounded-full" style={{ backgroundColor: 'var(--color-badge)', color: 'var(--color-accent)' }}>
                        {workout.category}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-secondary)' }}>
                No workouts found. Try adjusting your filters.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0" style={{ backgroundColor: 'var(--color-bg-secondary)', borderTopColor: 'var(--color-border)', borderTopWidth: '1px' }}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-around">
          <button className="flex flex-col items-center justify-center py-4 transition" style={{ color: 'var(--color-accent)' }}>
            <Home size={24} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center py-4 transition" style={{ color: 'var(--color-text-secondary)' }}>
            <Play size={24} />
            <span className="text-xs mt-1 font-medium">Workouts</span>
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <User size={24} />
            <span className="text-xs mt-1 font-medium">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
