'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setResetLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'http://localhost:3000/auth/confirm',
      })

      if (resetError) {
        setError(resetError.message)
        setResetLoading(false)
        return
      }

      setSuccessMessage('Password reset link sent to your email!')
      setResetEmail('')
      setTimeout(() => {
        setForgotPasswordMode(false)
        setSuccessMessage('')
      }, 3000)
      setResetLoading(false)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setResetLoading(false)
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
        {!forgotPasswordMode ? (
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

            {/* Password Input with Toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition"
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 transition"
                  style={{ color: 'var(--color-text-secondary)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setForgotPasswordMode(true)}
                className="text-sm transition"
                style={{ color: 'var(--color-accent)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Forgot Password?
              </button>
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
        ) : (
          /* Forgot Password Form */
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Email Address
              </label>
              <input
                id="resetEmail"
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
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

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(193, 123, 138, 0.15)', borderColor: 'var(--color-accent)', borderWidth: '1px' }}>
                <p style={{ color: 'var(--color-accent)' }} className="text-sm">{successMessage}</p>
              </div>
            )}

            {/* Send Reset Link Button */}
            <button
              type="submit"
              disabled={resetLoading}
              className="w-full font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed text-white"
              style={{
                backgroundColor: resetLoading ? 'rgba(196, 133, 122, 0.5)' : 'var(--color-accent)',
              }}
              onMouseEnter={(e) => {
                if (!resetLoading) e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
              }}
              onMouseLeave={(e) => {
                if (!resetLoading) e.currentTarget.style.backgroundColor = 'var(--color-accent)'
              }}
            >
              {resetLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            {/* Back to Login Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(false)
                  setError('')
                  setSuccessMessage('')
                }}
                className="text-sm transition"
                style={{ color: 'var(--color-accent)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

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
