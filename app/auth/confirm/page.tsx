'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'

export default function ConfirmPage() {
  const router = useRouter()
  const { mounted } = useTheme()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    // Extract access token from URL hash
    const hash = window.location.hash
    console.log('Hash:', hash)

    if (hash.includes('access_token=')) {
      console.log('Access token found in hash')
      setHasToken(true)
    } else {
      console.log('No access token in hash')
      setError('Invalid or expired invite link. Please request a new invite.')
    }

    setLoading(false)
  }, [])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    // Validate passwords
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      setSubmitting(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setSubmitting(false)
      return
    }

    try {
      console.log('Updating user password...')
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        console.error('Password update error:', updateError)
        setError(updateError.message || 'Failed to set password')
        setSubmitting(false)
        return
      }

      console.log('✓ Password set successfully')
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error:', err)
      setError('An error occurred. Please try again.')
      setSubmitting(false)
    }
  }

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    )
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
          <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm mt-2">
            Set Up Your Account
          </p>
        </div>

        {hasToken ? (
          <>
            {/* Set Password Form */}
            <form onSubmit={handleSetPassword} className="space-y-4">
              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    borderWidth: '1px',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-1">
                  Minimum 6 characters
                </p>
              </div>

              {/* Confirm Password Input */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    borderWidth: '1px',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'rgba(193, 123, 138, 0.15)', borderColor: 'var(--color-accent)', borderWidth: '1px' }}>
                  <p style={{ color: 'var(--color-accent)' }} className="text-sm">
                    {error}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full font-semibold py-3 rounded-lg transition duration-200 disabled:cursor-not-allowed text-white"
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
                {submitting ? 'Setting password...' : 'Set Password'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Invalid Token Message */}
            <div className="rounded-lg px-6 py-8 text-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <p style={{ color: 'var(--color-text-primary)' }} className="font-semibold mb-2">
                Invalid Invite Link
              </p>
              <p style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
                {error}
              </p>
              <p style={{ color: 'var(--color-text-muted)' }} className="text-xs mt-4">
                Contact your FitMitra admin to request a new invite.
              </p>
            </div>
          </>
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
