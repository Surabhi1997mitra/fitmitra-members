'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="w-full max-w-sm">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-wider">
            <span style={{ color: 'var(--color-text-primary)' }}>Fit</span>
            <span style={{ color: 'var(--color-accent)' }}>Mitra</span>
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mt-2">Members Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-accent)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-accent)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(196, 133, 122, 0.15)', borderColor: 'var(--color-accent)', borderWidth: '1px' }}>
              <p style={{ color: 'var(--color-accent)' }} className="text-sm">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed text-white"
            style={{
              backgroundColor: loading ? 'rgba(196, 133, 122, 0.5)' : 'var(--color-accent)',
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = 'var(--color-accent)'
            }}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p style={{ color: 'var(--color-text-muted)' }} className="text-xs">
            © 2026 FitMitra. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
