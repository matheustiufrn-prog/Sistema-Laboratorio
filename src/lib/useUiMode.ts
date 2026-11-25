'use client'

import { useCallback, useEffect, useState } from 'react'

export type UiMode = 'light' | 'dark'

const KEY = 'ui_mode'

function apply(mode: UiMode) {
  document.documentElement.dataset.mode = mode
}

// Guarda a escolha de modo (claro ou escuro) no navegador e aplica em <html data-mode="...">.
// Na primeira visita, segue a preferência do sistema operacional.
export function useUiMode() {
  const [mode, setModeState] = useState<UiMode>('light')

  useEffect(() => {
    const saved = localStorage.getItem(KEY)
    const initial: UiMode =
      saved === 'light' || saved === 'dark'
        ? saved
        : window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'

    setModeState(initial)
    apply(initial)
  }, [])

  const setMode = useCallback((next: UiMode) => {
    setModeState(next)
    localStorage.setItem(KEY, next)
    apply(next)
  }, [])

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark')
  }, [mode, setMode])

  return { mode, setMode, toggle }
}
