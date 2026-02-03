'use client'

import { useEffect, useState } from 'react'
import { Icon } from './Icon'

const getThemeFromDOM = (): boolean => {
  if (typeof document === 'undefined') return false
  const el = document.documentElement
  return el.classList.contains('dark') || el.getAttribute('data-theme') === 'dark'
}

export const ThemeToggle = () => {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(getThemeFromDOM())
    setMounted(true)
  }, [])

  const handleToggle = () => {
    const next = !getThemeFromDOM()
    setDark(next)
    const el = document.documentElement
    el.classList.toggle('dark', next)
    el.setAttribute('data-theme', next ? 'dark' : 'light')
    el.style.colorScheme = next ? 'dark' : 'light'
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // ignore
    }
  }

  if (!mounted) {
    return (
      <span
        className="p-2 text-zinc-400 rounded-md inline-block w-9 h-9"
        aria-hidden
      >
        <Icon name="solar:moon-linear" size={20} />
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md transition-colors"
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
