import { useEffect, useState } from 'react'

const storageKey = 'busgo:theme'

type Theme = 'light' | 'dark'

function readInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // The active document class still applies even when persistence is blocked.
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)
  const isDark = theme === 'dark'

  useEffect(() => {
    document.documentElement.style.colorScheme = theme
  }, [theme])

  function toggleTheme() {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }

  return (
    <button
      type="button"
      className="group relative h-8 w-16 rounded-full border border-slate-200 bg-white p-1 text-slate-950 shadow-sm transition-colors duration-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      <span
        className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-slate-950 text-white shadow-sm transition-transform duration-300 ease-out group-aria-pressed:translate-x-8 dark:bg-cyan-300 dark:text-slate-950"
        aria-hidden="true"
      >
        {isDark ? (
          <span className="relative h-3.5 w-3.5 rounded-full bg-current">
            <span className="absolute -right-1 -top-0.5 h-3.5 w-3.5 rounded-full bg-cyan-300" />
          </span>
        ) : (
          <span className="relative h-3.5 w-3.5 rounded-full bg-current">
            <span className="absolute -left-0.5 top-1/2 h-0.5 w-4 -translate-y-1/2 rounded-full bg-current" />
            <span className="absolute left-1/2 -top-0.5 h-4 w-0.5 -translate-x-1/2 rounded-full bg-current" />
          </span>
        )}
      </span>
    </button>
  )
}
