'use client'

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from 'react'

import { useRouter } from 'next/navigation'

type TeamRoutePendingValue = {
  navigateWithTransition: (href: string) => void
  isPending: boolean
}

const TeamRoutePendingContext = createContext<TeamRoutePendingValue | null>(null)

export function useTeamRoutePending(): TeamRoutePendingValue | null {
  return useContext(TeamRoutePendingContext)
}

/**
 * Wraps `/team` so filter/month navigations use `useTransition`.
 * Pair with `TeamRouteSection` per slot for in-place section skeletons while pending.
 */
export function TeamRoutePendingShell({ children }: { children: ReactNode }) {
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
    <TeamRoutePendingContext.Provider value={{ navigateWithTransition, isPending }}>
      <div
        className="flex min-h-[50vh] flex-col gap-8"
        aria-busy={isPending}
        aria-live="polite"
      >
        {children}
      </div>
    </TeamRoutePendingContext.Provider>
  )
}
