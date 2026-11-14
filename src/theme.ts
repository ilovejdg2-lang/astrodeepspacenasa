import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'vitalink-theme'

export function readThemeChoice(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'light' || value === 'dark' || value === 'system') return value
  } catch {
    /* almacenamiento no disponible */
  }
  return 'system'
}

export function applyTheme(choice: ThemeChoice): 'light' | 'dark' {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const resolved = choice === 'system' ? (systemDark ? 'dark' : 'light') : choice
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
  try {
    localStorage.setItem(KEY, choice)
  } catch {
    /* se aplica igual en esta visita */
  }
  return resolved
}

export function useTheme(): { choice: ThemeChoice; resolved: 'light' | 'dark'; setChoice: (choice: ThemeChoice) => void } {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => readThemeChoice())
  const [resolved, setResolved] = useState<'light' | 'dark'>(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    setResolved(applyTheme(choice))
    if (choice !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setResolved(applyTheme('system'))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [choice])

  return { choice, resolved, setChoice: setChoiceState }
}
