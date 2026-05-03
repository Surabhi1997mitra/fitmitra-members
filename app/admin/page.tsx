'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Sun, Moon, Plus, Trash2, X } from 'lucide-react'

interface Profile {
  id: string
  full_name: string
  email: string
  access_expires_at: string
  is_active: boolean
  created_at: string
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

export default function AdminPage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()

  const [activeTab, setActiveTab] = useState<'users' | 'videos'>('users')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

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
  const [newVideo, setNewVideo] = useState({
    title: '',
    description: '',
    categoryId: '',
    tags: '',
  })
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle')
  const [uploadingVideoId, setUploadingVideoId] = useState<string | null>(null)

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
    await Promise.all([fetchUsers(), fetchVideos(), fetchCategories()])
    setLoading(false)
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, access_expires_at, is_active, created_at')
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

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setUploadStatus('uploading')

    try {
      if (!newVideo.categoryId) {
        setError('Please select a category')
        setUploadStatus('error')
        return
      }

      if (!videoFile) {
        setError('Please select a video file')
        setUploadStatus('error')
        return
      }

      // Get session for auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expired')
        setUploadStatus('error')
        return
      }

      const authHeader = `Bearer ${session.access_token}`

      // Parse tags
      const tags = newVideo.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Step 1: Call upload API to get Mux URL
      console.log('Calling /api/videos/upload...')
      const uploadResponse = await fetch('/api/videos/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          title: newVideo.title,
          description: newVideo.description,
          category_id: newVideo.categoryId,
          tags,
        }),
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        setError(error.error || 'Failed to initiate upload')
        setUploadStatus('error')
        return
      }

      const { uploadUrl, videoId } = await uploadResponse.json()
      console.log('✓ Got upload URL, videoId:', videoId)
      setUploadingVideoId(videoId)

      // Step 2: Upload file directly to Mux
      console.log('Uploading video file to Mux...')
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(progress)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('✓ File uploaded to Mux')
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
        xhr.send(videoFile)
      })

      // Step 3: Poll status until ready
      setUploadStatus('processing')
      setUploadProgress(0)
      console.log('Polling for video readiness...')

      let isReady = false
      let pollCount = 0
      const maxPolls = 60 // 5 minutes with 5s interval

      while (!isReady && pollCount < maxPolls) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        pollCount++

        const statusResponse = await fetch(`/api/videos/${videoId}`, {
          method: 'GET',
          headers: { 'Authorization': authHeader },
        })

        if (!statusResponse.ok) {
          console.error('Status check failed')
          continue
        }

        const video = await statusResponse.json()
        console.log('Video status:', video.status)

        if (video.status === 'ready') {
          isReady = true
          setUploadStatus('ready')
          console.log('✓ Video is ready')
        } else if (video.status === 'errored') {
          throw new Error('Video processing failed')
        }
      }

      if (!isReady) {
        throw new Error('Video processing timeout')
      }

      // Success - reset form and refresh
      setSuccessMessage(`Video "${newVideo.title}" uploaded successfully!`)
      setNewVideo({ title: '', description: '', categoryId: '', tags: '' })
      setVideoFile(null)
      setUploadProgress(0)
      setUploadStatus('idle')
      setUploadingVideoId(null)
      setShowAddVideoForm(false)
      await fetchVideos()

      setTimeout(() => setSuccessMessage(''), 5000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      setUploadStatus('error')
    }
  }

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

  const handleLogout = async () => {
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
                users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg flex items-center justify-between"
                    style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        {user.full_name}
                      </p>
                      <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
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
                ))
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
                Add New Video
              </button>
            </div>

            {/* Add Video Form */}
            {showAddVideoForm && (
              <div className="mb-6 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    New Video
                  </h3>
                  <button
                    onClick={() => setShowAddVideoForm(false)}
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleCreateVideo} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
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
                      Description
                    </label>
                    <textarea
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      rows={3}
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
                      Category
                    </label>
                    <select
                      value={newVideo.categoryId}
                      onChange={(e) => setNewVideo({ ...newVideo, categoryId: e.target.value })}
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
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={newVideo.tags}
                      onChange={(e) => setNewVideo({ ...newVideo, tags: e.target.value })}
                      placeholder="e.g. beginner, arms, strength"
                      className="w-full px-4 py-2 rounded-lg focus:outline-none"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: 'var(--color-border)',
                        borderWidth: '1px',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* File Upload Area */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Video File
                    </label>
                    <div
                      className="relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition"
                      style={{
                        backgroundColor: 'var(--color-bg-primary)',
                        borderColor: videoFile ? 'var(--color-accent)' : 'var(--color-border)',
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        const files = e.dataTransfer.files
                        if (files.length > 0) {
                          setVideoFile(files[0])
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                      }}
                    >
                      <input
                        id="videoFile"
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setVideoFile(e.target.files[0])
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="videoFile" className="cursor-pointer">
                        {videoFile ? (
                          <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                            {videoFile.name}
                          </p>
                        ) : (
                          <>
                            <p style={{ color: 'var(--color-text-primary)' }} className="font-medium">
                              Drag and drop your video here
                            </p>
                            <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mt-1">
                              or click to browse
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Upload Progress Bar */}
                  {uploadStatus !== 'idle' && uploadProgress > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                        Upload Progress: {uploadProgress}%
                      </label>
                      <div className="w-full h-2 rounded-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${uploadProgress}%`,
                            backgroundColor: 'var(--color-accent)',
                          }}
                        />
                      </div>
                      {uploadStatus === 'processing' && (
                        <p style={{ color: 'var(--color-accent)' }} className="text-xs mt-2">
                          Processing video... this may take a few minutes
                        </p>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploadStatus !== 'idle' && uploadStatus !== 'error'}
                    className="w-full py-2 rounded-lg text-white font-semibold transition"
                    style={{
                      backgroundColor:
                        uploadStatus !== 'idle' && uploadStatus !== 'error'
                          ? 'rgba(193, 123, 138, 0.5)'
                          : 'var(--color-accent)',
                    }}
                    onMouseEnter={(e) => {
                      if (uploadStatus === 'idle' || uploadStatus === 'error') {
                        e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (uploadStatus === 'idle' || uploadStatus === 'error') {
                        e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                      }
                    }}
                  >
                    {uploadStatus === 'uploading'
                      ? 'Uploading...'
                      : uploadStatus === 'processing'
                      ? 'Processing...'
                      : uploadStatus === 'ready'
                      ? 'Complete!'
                      : uploadStatus === 'error'
                      ? 'Retry Upload'
                      : 'Upload Video'}
                  </button>
                </form>
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
      </div>
    </div>
  )
}
