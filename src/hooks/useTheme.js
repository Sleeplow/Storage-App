import { useEffect, useState } from 'react'

const STORAGE_KEY = 'storageapp-theme'

function applyTheme(preference) {
  const root = document.documentElement
  if (preference === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else if (preference === 'light') {
    root.setAttribute('data-theme', 'light')
  } else {
    // 'system' — remove attribute, let @media prefers-color-scheme take over
    root.removeAttribute('data-theme')
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'system'
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = (newTheme) => {
    localStorage.setItem(STORAGE_KEY, newTheme)
    setThemeState(newTheme)
  }

  return [theme, setTheme]
}
