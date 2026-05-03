'use client'

import { ReactNode, useEffect, useState } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark'
    applyTheme(savedTheme)
    setMounted(true)
  }, [])

  const applyTheme = (theme: string) => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('theme', theme)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return <>{children}</>
}

export function useTheme() {
  const [theme, setTheme] = useState<string>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    setTheme(savedTheme)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    if (newTheme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('theme', newTheme)
    setTheme(newTheme)
  }

  return { theme, toggleTheme, mounted }
}
