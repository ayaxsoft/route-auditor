'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

interface ThemeProviderProps {
  children: React.ReactNode
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <NextThemesProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  )
}

export default ThemeProvider
