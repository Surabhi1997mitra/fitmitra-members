'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-provider'
import { LogOut, Sun, Moon, MessageCircle } from 'lucide-react'

export default function AccessExpiredPage() {
  const router = useRouter()
  const { theme, toggleTheme, mounted } = useTheme()
  const [loading, setLoading] = useState(true)

  const COACH_WHATSAPP_NUMBER = '+919876543210' // Replace with actual number

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleWhatsApp = () => {
    const message = encodeURIComponent('Hi, I would like to renew my FitMitra membership access.')
    window.open(`https://wa.me/${COACH_WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${message}`, '_blank')
  }

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <div className="absolute top-4 right-4 flex gap-2">
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
      </div>

      {/* Content */}
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold mb-2">
          <span style={{ color: 'var(--color-text-primary)' }}>Fit</span>
          <span style={{ color: 'var(--color-accent)' }}>Mitra</span>
        </h1>

        <div className="my-8 text-5xl">⏰</div>

        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Your access has expired
        </h2>

        <p className="text-lg mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Please contact your coach to renew your access to FitMitra.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition text-lg"
            style={{ backgroundColor: 'var(--color-accent)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent)'
            }}
          >
            <MessageCircle size={20} />
            Contact on WhatsApp
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg transition text-lg font-semibold"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
