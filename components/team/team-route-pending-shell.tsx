'use client'

import { TeamPageSkeleton } from '@/components/team/team-page-skeleton'
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
 * Mirrors overview pending UX: month changes on `/team` run inside `useTransition` so the list/select
 * shows loading until the RSC payload updates.
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
      <div className="relative flex min-h-[50vh] flex-col gap-8">
        {children}
        {isPending ? (
          <div
            className="absolute inset-0 z-30 flex justify-center rounded-lg bg-background/75 pt-4 backdrop-blur-[1px] supports-backdrop-filter:bg-background/65"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="sr-only">Loading team</span>
            <div className="h-fit w-full max-w-6xl">
              <TeamPageSkeleton />
            </div>
          </div>
        ) : null}
      </div>
    </TeamRoutePendingContext.Provider>
  )
}
