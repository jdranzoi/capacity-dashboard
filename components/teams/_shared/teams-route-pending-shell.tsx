'use client'

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from 'react'

import { useRouter } from 'next/navigation'

type TeamsRoutePendingValue = {
  navigateWithTransition: (href: string) => void
  isPending: boolean
}

const TeamsRoutePendingContext = createContext<TeamsRoutePendingValue | null>(null)

export function useTeamsRoutePending(): TeamsRoutePendingValue | null {
  return useContext(TeamsRoutePendingContext)
}

/**
 * Wraps `/teams/*` routes so month navigations use `useTransition`.
 * Pair with `TeamsRouteSection` per slot for in-place section skeletons while pending.
 */
export function TeamsRoutePendingShell({ children }: { children: ReactNode }) {
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
    <TeamsRoutePendingContext.Provider value={{ navigateWithTransition, isPending }}>
      <div
        className="flex min-h-[50vh] flex-col gap-8"
        aria-busy={isPending}
        aria-live="polite"
      >
        {children}
      </div>
    </TeamsRoutePendingContext.Provider>
  )
}
