'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { NavigationCommandDialog } from '@/components/layout/navigation-command-menu'

type NavigationSearchContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const NavigationSearchContext = createContext<NavigationSearchContextValue | null>(null)

export function NavigationSearchProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next)
  }, [])

  return (
    <NavigationSearchContext.Provider value={{ open, setOpen: handleOpenChange }}>
      {children}
      <NavigationCommandDialog open={open} onOpenChange={handleOpenChange} />
    </NavigationSearchContext.Provider>
  )
}

export function useNavigationSearch() {
  const ctx = useContext(NavigationSearchContext)
  if (!ctx) {
    throw new Error('useNavigationSearch must be used within NavigationSearchProvider')
  }
  return ctx
}
