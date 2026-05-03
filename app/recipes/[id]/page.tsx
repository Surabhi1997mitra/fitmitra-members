'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Sun, Moon, Home, Play, UtensilsCrossed, User, ArrowLeft } from 'lucide-react'

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

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecipe = async () => {
      const { id } = await params
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single()

      if (!error && data) {
        setRecipe(data as Recipe)
      }

      setLoading(false)
    }

    fetchRecipe()
  }, [params])

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

  if (!recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Recipe not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: 'var(--color-bg-primary)', borderBottomColor: 'var(--color-border)', borderBottomWidth: '1px' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/recipes" className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <ArrowLeft size={24} />
            <span className="font-medium">Back</span>
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero Image/Emoji */}
        <div className="mb-8 flex flex-col items-center">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full max-w-sm h-64 object-cover rounded-xl mb-6"
            />
          ) : (
            <div className="text-8xl mb-6">🥗</div>
          )}
        </div>

        {/* Title & Category */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
            {recipe.title}
          </h1>
          <span
            className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-accent)' }}
          >
            {recipe.category}
          </span>
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="mb-6 text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {recipe.description}
          </p>
        )}

        {/* Macro Strip */}
        {(recipe.calories !== undefined || recipe.protein !== undefined || recipe.carbs !== undefined || recipe.fat !== undefined) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {recipe.calories !== undefined && (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                <p className="text-sm font-medium">Calories</p>
                <p className="text-2xl font-bold">{recipe.calories}</p>
              </div>
            )}
            {recipe.protein !== undefined && (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                <p className="text-sm font-medium">Protein</p>
                <p className="text-2xl font-bold">{recipe.protein}g</p>
              </div>
            )}
            {recipe.carbs !== undefined && (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                <p className="text-sm font-medium">Carbs</p>
                <p className="text-2xl font-bold">{recipe.carbs}g</p>
              </div>
            )}
            {recipe.fat !== undefined && (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#10b981', color: 'white' }}>
                <p className="text-sm font-medium">Fat</p>
                <p className="text-2xl font-bold">{recipe.fat}g</p>
              </div>
            )}
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Ingredients
            </h2>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className="flex gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="text-xl">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Instructions
            </h2>
            <ol className="space-y-3">
              {recipe.instructions.map((instruction, idx) => (
                <li key={idx} className="flex gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="font-bold text-lg w-6" style={{ color: 'var(--color-accent)' }}>
                    {idx + 1}.
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ol>
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
