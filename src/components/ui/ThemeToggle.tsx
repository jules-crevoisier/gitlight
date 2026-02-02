'use client'

import { useEffect, useState } from 'react'
import { Icon } from './Icon'

export const ThemeToggle = () => {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = stored === 'dark' || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 text-zinc-500 hover:text-zinc-900 rounded-md"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <Icon name="solar:sun-2-linear" size={20} />
      ) : (
        <Icon name="solar:moon-linear" size={20} />
      )}
    </button>
  )
}
