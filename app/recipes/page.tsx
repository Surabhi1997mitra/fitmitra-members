'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Sun, Moon, Home, Play, UtensilsCrossed, User, Search } from 'lucide-react'

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

const RECIPE_CATEGORIES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout']

export default function RecipesPage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setRecipes(data as Recipe[])
        setFilteredRecipes(data as Recipe[])
      }

      setLoading(false)
    }

    fetchRecipes()
  }, [])

  useEffect(() => {
    let filtered = recipes

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((recipe) => recipe.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter((recipe) =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRecipes(filtered)
  }, [selectedCategory, searchQuery, recipes])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleRecipeClick = (id: string) => {
    router.push(`/recipes/${id}`)
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

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Page Title */}
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-text-primary)' }}>
          Nutrition
        </h1>

        {/* Search Bar */}
        <div className="mb-8 relative">
          <Search size={20} className="absolute left-3 top-3" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            placeholder="Search recipes..."
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
          {RECIPE_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="flex-none px-4 py-2 rounded-full transition whitespace-nowrap text-sm font-medium snap-start"
              style={{
                backgroundColor: selectedCategory === category ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                color: selectedCategory === category ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Recipe Grid */}
        {filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                onClick={() => handleRecipeClick(recipe.id)}
                className="rounded-xl overflow-hidden cursor-pointer transition hover:opacity-80"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                {/* Recipe Image or Emoji */}
                {recipe.image_url ? (
                  <img
                    src={recipe.image_url}
                    alt={recipe.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 flex items-center justify-center text-5xl" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                    🥗
                  </div>
                )}

                {/* Card Content */}
                <div className="p-4">
                  {/* Category Badge */}
                  <span
                    className="inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                  >
                    {recipe.category}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>
                    {recipe.title}
                  </h3>

                  {/* Calories */}
                  {recipe.calories !== undefined && (
                    <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      {recipe.calories} cal
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              No recipes found
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
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Play size={24} />
            <span className="text-xs mt-1 font-medium">Workouts</span>
          </Link>
          <Link
            href="/recipes"
            className="flex flex-col items-center justify-center py-4 transition"
            style={{ color: 'var(--color-accent)' }}
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
