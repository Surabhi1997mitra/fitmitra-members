'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Sun, Moon, Plus, Trash2, X, ArrowLeft } from 'lucide-react'

interface UploadItem {
  id: string
  file: File
  title: string
  description: string
  categoryId: string
  tags: string
  progress: number
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error'
  error?: string
  videoId?: string
}

interface Profile {
  id: string
  full_name: string
  email: string
  access_expires_at: string
  is_active: boolean
  created_at: string
  client_profile?: {
    completed: boolean
  }
}

interface Video {
  id: string
  title: string
  description: string
  category_id: string
  tags: string[]
  mux_upload_id?: string
  mux_asset_id?: string
  mux_playback_id?: string
  thumbnail_url?: string
  duration?: number
  status?: string
  created_at: string
}

interface Category {
  id: string
  name: string
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

const RECIPE_CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout']

export default function AdminPage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()

  const [activeTab, setActiveTab] = useState<'users' | 'videos' | 'recipes'>('users')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Users tab state
  const [users, setUsers] = useState<Profile[]>([])
  const [showAddUserForm, setShowAddUserForm] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    accessDuration: 90,
  })

  // Videos tab state
  const [videos, setVideos] = useState<Video[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showAddVideoForm, setShowAddVideoForm] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const xhrMap = useRef<Map<string, XMLHttpRequest>>(new Map())

  // Recipes tab state
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [showAddRecipeForm, setShowAddRecipeForm] = useState(false)
  const [newRecipe, setNewRecipe] = useState({
    title: '',
    description: '',
    category: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    ingredients: '',
    instructions: '',
    image_url: '',
    tags: '',
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log('Session:', session?.user?.id)

    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    console.log('Profile fetch error:', profileError)
    console.log('Profile data:', profile)
    console.log('Is admin:', profile?.is_admin)

    if (profileError || !profile?.is_admin) {
      console.log('Not admin, redirecting to dashboard')
      router.push('/dashboard')
      return
    }

    console.log('Admin verified, loading data...')
    await Promise.all([fetchUsers(), fetchVideos(), fetchCategories(), fetchRecipes()])
    setLoading(false)
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, access_expires_at, is_active, created_at, client_profile(completed)')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setUsers(data as Profile[])
    }
  }

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from('videos')
      .select('id, title, description, category_id, tags, mux_upload_id, mux_asset_id, mux_playback_id, thumbnail_url, duration, status, created_at')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setVideos(data as Video[])
    }
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name', { ascending: true })

    if (!error && data) {
      setCategories(data as Category[])
    }
  }

  const fetchRecipes = async () => {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRecipes(data as Recipe[])
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      console.log('=== FORM SUBMISSION ===')
      console.log('Session:', session?.user?.id)
      console.log('Access token exists:', !!session?.access_token)
      console.log('Access token:', session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'MISSING')

      if (!session) {
        console.error('No session found')
        setError('Session expired')
        setSubmitting(false)
        return
      }

      const authHeader = `Bearer ${session.access_token}`
      console.log('Authorization header:', authHeader.substring(0, 30) + '...')

      console.log('Sending fetch request to /api/admin/create-user')
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          email: newUser.email,
          accessDuration: newUser.accessDuration,
        }),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error response:', errorData)
        setError(errorData.error || 'Failed to create user')
        setSubmitting(false)
        return
      }

      console.log('✓ Success response received')

      // Show success message
      setSuccessMessage(`Invite sent to ${newUser.email}`)

      // Reset form and refresh users
      setNewUser({ email: '', accessDuration: 90 })
      setShowAddUserForm(false)
      await fetchUsers()
      setSubmitting(false)

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      setError('An error occurred')
      setSubmitting(false)
    }
  }

  const handleDeactivateUser = async (userId: string) => {
    const confirmed = window.confirm('Deactivate this user?')
    if (!confirmed) return

    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', userId)

    if (error) {
      setError('Failed to deactivate user')
      return
    }

    await fetchUsers()
  }

  const handleResendInvite = async (email: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setError('Session expired')
      return
    }

    const authHeader = `Bearer ${session.access_token}`

    try {
      const response = await fetch('/api/admin/resend-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to resend invite')
        return
      }

      setSuccessMessage(`Invite resent to ${email}`)
      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      setError('An error occurred while resending invite')
    }
  }

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setUploadQueue((q) =>
      q.map((item) => (item.id === id ? { ...item, ...patch } : item))
    )
  }

  const handleFilesSelected = (files: FileList) => {
    const newItems: UploadItem[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      title: file.name.replace(/\.[^.]+$/, ''),
      description: '',
      categoryId: '',
      tags: '',
      progress: 0,
      status: 'queued',
    }))
    setUploadQueue((prev) => [...prev, ...newItems])
  }

  const uploadSingleFile = async (item: UploadItem, authHeader: string) => {
    try {
      updateItem(item.id, { status: 'uploading' })

      // Step 1: Get upload URL
      const createUploadResponse = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          title: item.title,
          description: item.description,
          category_id: item.categoryId,
          tags: item.tags ? item.tags.split(',').map((t) => t.trim()) : [],
        }),
      })

      if (!createUploadResponse.ok) {
        const errorData = await createUploadResponse.json()
        throw new Error(errorData.error || 'Failed to create upload')
      }

      const { uploadUrl, videoId } = await createUploadResponse.json()
      updateItem(item.id, { videoId })

      // Step 2: Upload file with XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            updateItem(item.id, { progress })
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })

        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', 'application/octet-stream')
        xhrMap.current.set(item.id, xhr)
        xhr.send(item.file)
      })

      xhrMap.current.delete(item.id)
      updateItem(item.id, { status: 'processing', progress: 100 })

      // Step 3: Poll until ready
      let isReady = false
      let pollCount = 0
      const maxPolls = 60

      while (!isReady && pollCount < maxPolls) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        pollCount++

        const statusResponse = await fetch(`/api/videos/${videoId}`, {
          method: 'GET',
          headers: { 'Authorization': authHeader },
        })

        if (!statusResponse.ok) continue

        const video = await statusResponse.json()

        if (video.status === 'ready') {
          isReady = true
          updateItem(item.id, { status: 'done' })
          await fetchVideos()
        } else if (video.status === 'errored') {
          throw new Error('Video processing failed')
        }
      }

      if (!isReady) throw new Error('Processing timeout')
    } catch (err) {
      xhrMap.current.delete(item.id)
      updateItem(item.id, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const handleUploadAll = async () => {
    const queuedItems = uploadQueue.filter((item) => item.status === 'queued')
    if (queuedItems.length === 0) return

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Session expired')
      return
    }

    const authHeader = `Bearer ${session.access_token}`

    // Fire all uploads in parallel
    queuedItems.forEach((item) => {
      uploadSingleFile(item, authHeader)
    })
  }

  const handleCancelUpload = (id: string) => {
    const item = uploadQueue.find((i) => i.id === id)
    if (!item) return

    if (item.status === 'uploading') {
      xhrMap.current.get(id)?.abort()
      xhrMap.current.delete(id)
    }

    setUploadQueue((q) => q.filter((i) => i.id !== id))
  }

  const clearDoneItems = () => {
    setUploadQueue((q) => q.filter((i) => i.status !== 'done'))
  }

  // Auto-refresh videos every 30s when processing
  useEffect(() => {
    const interval = setInterval(() => {
      if (uploadQueue.some((item) => item.status === 'processing')) {
        fetchVideos()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [uploadQueue])

  const handleDeleteVideo = async (videoId: string) => {
    const confirmed = window.confirm('Delete this video?')
    if (!confirmed) return

    const { error } = await supabase.from('videos').delete().eq('id', videoId)

    if (error) {
      setError('Failed to delete video')
      return
    }

    await fetchVideos()
  }

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const { error } = await supabase.from('recipes').insert({
        title: newRecipe.title,
        description: newRecipe.description || null,
        category: newRecipe.category,
        calories: newRecipe.calories ? parseInt(newRecipe.calories) : null,
        protein: newRecipe.protein ? parseInt(newRecipe.protein) : null,
        carbs: newRecipe.carbs ? parseInt(newRecipe.carbs) : null,
        fat: newRecipe.fat ? parseInt(newRecipe.fat) : null,
        ingredients: newRecipe.ingredients.split('\n').filter(Boolean),
        instructions: newRecipe.instructions.split('\n').filter(Boolean),
        image_url: newRecipe.image_url || null,
        tags: newRecipe.tags.split(',').map((t) => t.trim()).filter(Boolean),
      })

      if (error) {
        setError(error.message || 'Failed to create recipe')
        setSubmitting(false)
        return
      }

      setSuccessMessage('Recipe created successfully!')
      setNewRecipe({
        title: '',
        description: '',
        category: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        ingredients: '',
        instructions: '',
        image_url: '',
        tags: '',
      })
      setShowAddRecipeForm(false)
      await fetchRecipes()
      setSubmitting(false)

      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      setError('An error occurred')
      setSubmitting(false)
    }
  }

  const handleDeleteRecipe = async (recipeId: string) => {
    const confirmed = window.confirm('Delete this recipe?')
    if (!confirmed) return

    const { error } = await supabase.from('recipes').delete().eq('id', recipeId)

    if (error) {
      setError('Failed to delete recipe')
      return
    }

    await fetchRecipes()
  }

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const isAccessExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40" style={{ backgroundColor: 'var(--color-bg-primary)', borderBottomColor: 'var(--color-border)', borderBottomWidth: '1px' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg transition flex items-center justify-center"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
              }}
              title="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </Link>
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold">
                <span style={{ color: 'var(--color-text-primary)' }}>Fit</span>
                <span style={{ color: 'var(--color-accent)' }}>Mitra</span>
              </h1>
            </Link>
          </div>
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

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6 border-b" style={{ borderBottomColor: 'var(--color-border)' }}>
          <button
            onClick={() => setActiveTab('users')}
            className="pb-4 font-semibold transition border-b-2"
            style={{
              color: activeTab === 'users' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              borderBottomColor: activeTab === 'users' ? 'var(--color-accent)' : 'transparent',
            }}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className="pb-4 font-semibold transition border-b-2"
            style={{
              color: activeTab === 'videos' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              borderBottomColor: activeTab === 'videos' ? 'var(--color-accent)' : 'transparent',
            }}
          >
            Videos
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className="pb-4 font-semibold transition border-b-2"
            style={{
              color: activeTab === 'recipes' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              borderBottomColor: activeTab === 'recipes' ? 'var(--color-accent)' : 'transparent',
            }}
          >
            Recipes
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(193, 123, 138, 0.15)', borderColor: 'var(--color-accent)', borderWidth: '1px' }}>
            <p style={{ color: 'var(--color-accent)' }} className="text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mt-6 rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(193, 123, 138, 0.15)', borderColor: 'var(--color-accent)', borderWidth: '1px' }}>
            <p style={{ color: 'var(--color-accent)' }} className="text-sm">
              ✓ {successMessage}
            </p>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Clients
              </h2>
              <button
                onClick={() => setShowAddUserForm(!showAddUserForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition font-semibold"
                style={{
                  backgroundColor: 'var(--color-accent)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                }}
              >
                <Plus size={20} />
                Add New Client
              </button>
            </div>

            {/* Add User Form */}
            {showAddUserForm && (
              <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    New Client
                  </h3>
                  <button
                    onClick={() => setShowAddUserForm(false)}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Access Duration
                    </label>
                    <select
                      value={newUser.accessDuration}
                      onChange={(e) => setNewUser({ ...newUser, accessDuration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <option value={30}>30 days</option>
                      <option value={60}>60 days</option>
                      <option value={90}>90 days (default)</option>
                      <option value={180}>180 days</option>
                      <option value={365}>365 days</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 rounded-lg text-white font-semibold transition"
                    style={{
                      backgroundColor: submitting ? 'rgba(193, 123, 138, 0.5)' : 'var(--color-accent)',
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                    }}
                    onMouseLeave={(e) => {
                      if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                    }}
                  >
                    {submitting ? 'Sending invite...' : 'Send Invite'}
                  </button>
                </form>
              </div>
            )}

            {/* Users List */}
            <div className="space-y-3">
              {users.length > 0 ? (
                users.map((user) => {
                  const hasLoggedIn = !!user.full_name
                  const profileCompleted = (user.client_profile as any)?.completed
                  return (
                    <div
                      key={user.id}
                      className="p-4 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {user.full_name || user.email.split('@')[0]}
                          </p>
                          <span className="text-lg">{profileCompleted ? '🟢' : '🔴'}</span>
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {profileCompleted ? 'Profile filled' : 'No profile'}
                          </span>
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                            Expires: {formatDate(user.access_expires_at)}
                          </span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: user.is_active && !isAccessExpired(user.access_expires_at) ? 'rgba(193, 123, 138, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                              color: user.is_active && !isAccessExpired(user.access_expires_at) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                            }}
                          >
                            {user.is_active && !isAccessExpired(user.access_expires_at) ? 'Active' : 'Expired'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!hasLoggedIn && (
                          <button
                            onClick={() => handleResendInvite(user.email)}
                            className="px-4 py-2 rounded-lg transition text-sm font-medium"
                            style={{
                              backgroundColor: 'rgba(59, 130, 246, 0.2)',
                              color: '#3b82f6',
                            }}
                          >
                            Resend Invite
                          </button>
                        )}
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          disabled={!user.is_active}
                          className="px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: 'rgba(193, 123, 138, 0.2)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          Deactivate
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>No users yet.</p>
              )}
            </div>
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Videos
              </h2>
              <div className="flex items-center gap-2">
                {!showAddVideoForm && uploadQueue.some((i) => ['uploading', 'processing'].includes(i.status)) && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                  >
                    {uploadQueue.filter((i) => ['uploading', 'processing'].includes(i.status)).length} active
                  </span>
                )}
                <button
                  onClick={() => setShowAddVideoForm(!showAddVideoForm)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition font-semibold"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                  }}
                >
                  <Plus size={20} />
                  Add Videos
                </button>
              </div>
            </div>

            {/* Upload Queue Panel */}
            {showAddVideoForm && (
              <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    Upload Videos
                  </h3>
                  <button
                    onClick={() => setShowAddVideoForm(false)}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* File Input */}
                <div className="mb-6">
                  <label htmlFor="bulkFileInput" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Select Videos
                  </label>
                  <div
                    className="relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border)',
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleFilesSelected(e.dataTransfer.files)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                    }}
                  >
                    <input
                      id="bulkFileInput"
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFilesSelected(e.target.files)
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="bulkFileInput" className="cursor-pointer">
                      <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                        Drag and drop videos here
                      </p>
                      <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mt-1">
                        or click to browse
                      </p>
                    </label>
                  </div>
                </div>

                {/* Upload Queue */}
                {uploadQueue.length > 0 && (
                  <div className="mb-6">
                    <div className="space-y-4">
                      {uploadQueue.map((item) => (
                        <div key={item.id} className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}>
                          {/* File name and cancel button */}
                          <div className="flex items-center justify-between mb-2">
                            <p style={{ color: 'var(--color-text-primary)' }} className="font-medium text-sm truncate flex-1">
                              {item.file.name}
                            </p>
                            <button
                              onClick={() => handleCancelUpload(item.id)}
                              className="ml-2 p-1 rounded transition hover:opacity-70"
                              style={{ color: 'var(--color-text-secondary)' }}
                              disabled={item.status === 'done'}
                            >
                              <X size={18} />
                            </button>
                          </div>

                          {/* Metadata (editable only when queued) */}
                          {item.status === 'queued' && (
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                placeholder="Title"
                                className="px-2 py-1 rounded text-sm focus:outline-none"
                                style={{
                                  backgroundColor: 'var(--color-bg-secondary)',
                                  borderColor: 'var(--color-border)',
                                  borderWidth: '1px',
                                  color: 'var(--color-text-primary)',
                                }}
                              />
                              <select
                                value={item.categoryId}
                                onChange={(e) => updateItem(item.id, { categoryId: e.target.value })}
                                className="px-2 py-1 rounded text-sm focus:outline-none"
                                style={{
                                  backgroundColor: 'var(--color-bg-secondary)',
                                  borderColor: 'var(--color-border)',
                                  borderWidth: '1px',
                                  color: 'var(--color-text-primary)',
                                }}
                              >
                                <option value="">Category</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Progress bar */}
                          {item.status !== 'queued' && (
                            <div className="mb-2">
                              <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${item.progress}%`,
                                    backgroundColor: 'var(--color-accent)',
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span style={{ color: 'var(--color-text-muted)' }} className="text-xs">
                                  {item.progress}%
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Status badge */}
                          <div className="flex items-center justify-between">
                            <span
                              className="px-2 py-1 rounded text-xs font-semibold"
                              style={{
                                backgroundColor:
                                  item.status === 'queued'
                                    ? 'rgba(0, 0, 0, 0.2)'
                                    : item.status === 'uploading'
                                    ? 'var(--color-accent)'
                                    : item.status === 'processing'
                                    ? 'rgba(251, 191, 36, 0.15)'
                                    : item.status === 'done'
                                    ? 'rgba(34, 197, 94, 0.15)'
                                    : 'rgba(239, 68, 68, 0.15)',
                                color:
                                  item.status === 'queued'
                                    ? 'var(--color-text-muted)'
                                    : item.status === 'uploading'
                                    ? 'white'
                                    : item.status === 'processing'
                                    ? '#d97706'
                                    : item.status === 'done'
                                    ? '#16a34a'
                                    : '#dc2626',
                              }}
                            >
                              {item.status === 'queued' ? 'Queued' : item.status === 'uploading' ? 'Uploading' : item.status === 'processing' ? 'Processing' : item.status === 'done' ? 'Done' : 'Error'}
                            </span>
                            {item.error && (
                              <span style={{ color: '#dc2626' }} className="text-xs">
                                {item.error}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleUploadAll}
                        disabled={!uploadQueue.some((i) => i.status === 'queued')}
                        className="flex-1 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: 'var(--color-accent)',
                        }}
                        onMouseEnter={(e) => {
                          if (uploadQueue.some((i) => i.status === 'queued')) {
                            e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                        }}
                      >
                        Upload All ({uploadQueue.filter((i) => i.status === 'queued').length})
                      </button>
                      {uploadQueue.some((i) => i.status === 'done') && (
                        <button
                          onClick={clearDoneItems}
                          className="px-4 py-2 rounded-lg transition"
                          style={{
                            backgroundColor: 'var(--color-bg-primary)',
                            borderColor: 'var(--color-border)',
                            borderWidth: '1px',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          Clear Done
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Videos List */}
            <div className="space-y-3">
              {videos.length > 0 ? (
                videos.map((video) => {
                  const category = categories.find((c) => c.id === video.category_id)
                  return (
                    <div
                      key={video.id}
                      className="p-4 rounded-lg flex items-center justify-between"
                      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {video.title}
                          </p>
                          {video.status && (
                            <span
                              className="px-2 py-1 rounded-full text-xs font-semibold"
                              style={{
                                backgroundColor:
                                  video.status === 'ready'
                                    ? 'rgba(193, 123, 138, 0.2)'
                                    : video.status === 'processing'
                                    ? 'rgba(193, 123, 138, 0.3)'
                                    : 'rgba(0, 0, 0, 0.2)',
                                color: 'var(--color-accent)',
                              }}
                            >
                              {video.status === 'ready'
                                ? 'Ready'
                                : video.status === 'uploading'
                                ? 'Uploading'
                                : video.status === 'processing'
                                ? 'Processing'
                                : 'Error'}
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                          {category?.name || 'Uncategorized'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteVideo(video.id)}
                        className="p-2 rounded-lg transition"
                        style={{
                          backgroundColor: 'rgba(193, 123, 138, 0.2)',
                          color: 'var(--color-accent)',
                        }}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )
                })
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>No videos yet.</p>
              )}
            </div>
          </div>
        )}

        {/* RECIPES TAB */}
        {activeTab === 'recipes' && (
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Recipes
              </h2>
              <button
                onClick={() => setShowAddRecipeForm(!showAddRecipeForm)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition font-semibold"
                style={{
                  backgroundColor: 'var(--color-accent)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                }}
              >
                <Plus size={20} />
                Add Recipe
              </button>
            </div>

            {/* Add Recipe Form */}
            {showAddRecipeForm && (
              <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    New Recipe
                  </h3>
                  <button
                    onClick={() => setShowAddRecipeForm(false)}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateRecipe} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={newRecipe.title}
                      onChange={(e) => setNewRecipe({ ...newRecipe, title: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Description
                    </label>
                    <textarea
                      value={newRecipe.description}
                      onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Category
                    </label>
                    <select
                      value={newRecipe.category}
                      onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                      required
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    >
                      <option value="">Select a category</option>
                      {RECIPE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Calories
                      </label>
                      <input
                        type="number"
                        value={newRecipe.calories}
                        onChange={(e) => setNewRecipe({ ...newRecipe, calories: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border)',
                          borderWidth: '1px',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        value={newRecipe.protein}
                        onChange={(e) => setNewRecipe({ ...newRecipe, protein: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border)',
                          borderWidth: '1px',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        value={newRecipe.carbs}
                        onChange={(e) => setNewRecipe({ ...newRecipe, carbs: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border)',
                          borderWidth: '1px',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Fat (g)
                      </label>
                      <input
                        type="number"
                        value={newRecipe.fat}
                        onChange={(e) => setNewRecipe({ ...newRecipe, fat: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg focus:outline-none"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          borderColor: 'var(--color-border)',
                          borderWidth: '1px',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Ingredients
                    </label>
                    <textarea
                      value={newRecipe.ingredients}
                      onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
                      placeholder="One per line"
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Instructions
                    </label>
                    <textarea
                      value={newRecipe.instructions}
                      onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
                      placeholder="One per line"
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Image URL (optional)
                    </label>
                    <input
                      type="url"
                      value={newRecipe.image_url}
                      onChange={(e) => setNewRecipe({ ...newRecipe, image_url: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newRecipe.tags}
                      onChange={(e) => setNewRecipe({ ...newRecipe, tags: e.target.value })}
                      placeholder="e.g. vegan, gluten-free, quick"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 rounded-lg text-white font-semibold transition"
                    style={{
                      backgroundColor: submitting ? 'rgba(193, 123, 138, 0.5)' : 'var(--color-accent)',
                    }}
                    onMouseEnter={(e) => {
                      if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                    }}
                    onMouseLeave={(e) => {
                      if (!submitting) e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                    }}
                  >
                    {submitting ? 'Creating...' : 'Create Recipe'}
                  </button>
                </form>
              </div>
            )}

            {/* Recipes List */}
            <div className="space-y-3">
              {recipes.length > 0 ? (
                recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="p-4 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {recipe.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: 'rgba(193, 123, 138, 0.2)', color: 'var(--color-accent)' }}
                        >
                          {recipe.category}
                        </span>
                        {recipe.calories && (
                          <span style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                            {recipe.calories} cal
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      className="p-2 rounded-lg transition"
                      style={{
                        backgroundColor: 'rgba(193, 123, 138, 0.2)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>No recipes yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

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
