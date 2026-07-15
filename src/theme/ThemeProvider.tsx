import React, { createContext, useContext, useMemo, useState } from 'react'

type Mode = 'light'|'dark'
const ThemeContext = createContext({ mode: 'light' as Mode, toggle: () => {} })

export const ThemeModeProvider = ({ children } : { children: React.ReactNode }) => {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem('iro_theme') as Mode) || 'light')
  const toggle = () => { const next = mode === 'light' ? 'dark' : 'light'; setMode(next); localStorage.setItem('iro_theme', next) }
  const val = useMemo(()=>({ mode, toggle }),[mode])
  return <ThemeContext.Provider value={val}>{children}</ThemeContext.Provider>
}

export const useThemeMode = () => useContext(ThemeContext)
