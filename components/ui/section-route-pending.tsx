'use client'

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from 'react'

import { useRouter } from 'next/navigation'

export type SectionRoutePendingValue = {
  navigateWithTransition: (href: string) => void
  isPending: boolean
}

export function createSectionRoutePendingContext() {
  const SectionRoutePendingContext = createContext<SectionRoutePendingValue | null>(null)

  function useSectionRoutePending(): SectionRoutePendingValue | null {
    return useContext(SectionRoutePendingContext)
  }

  function SectionRoutePendingShell({
    children,
    contentClassName = 'flex min-h-[50vh] flex-col gap-6',
  }: {
    children: ReactNode
    contentClassName?: string
  }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const navigateWithTransition = useCallback(
      (href: string) => {
        startTransition(() => {
          router.push(href, { scroll: false })
        })
      },
      [router]
    )

    return (
      <SectionRoutePendingContext.Provider value={{ navigateWithTransition, isPending }}>
        <div className={contentClassName} aria-busy={isPending} aria-live="polite">
          {children}
        </div>
      </SectionRoutePendingContext.Provider>
    )
  }

  function SectionRouteSection({
    children,
    fallback,
  }: {
    children: ReactNode
    fallback: ReactNode
  }) {
    const ctx = useSectionRoutePending()
    if (ctx?.isPending) {
      return <>{fallback}</>
    }
    return <>{children}</>
  }

  return {
    SectionRoutePendingShell,
    SectionRouteSection,
    useSectionRoutePending,
  }
}
