'use client'

import { WeeklyHeadlineSkeleton } from '@/components/overview/weekly-headline-skeleton'
import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from 'react'

import { useRouter } from 'next/navigation'

type OverviewRoutePendingValue = {
  /** Prefer this over bare `router.push` so month switches show a pending UI. */
  navigateWithTransition: (href: string) => void
  isPending: boolean
}

const OverviewRoutePendingContext = createContext<OverviewRoutePendingValue | null>(
  null
)

export function useOverviewRoutePending(): OverviewRoutePendingValue | null {
  return useContext(OverviewRoutePendingContext)
}

/**
 * Wraps `/` overview content so `router.push` for `?month=` runs inside `useTransition`.
 * Suspense often does not re-show its fallback for same-route search-only navigations (PPR);
 * `isPending` gives a reliable loading overlay until the RSC payload replaces the tree.
 */
export function OverviewRoutePendingShell({ children }: { children: ReactNode }) {
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
    <OverviewRoutePendingContext.Provider
      value={{ navigateWithTransition, isPending }}
    >
      <div className="relative flex min-h-[50vh] flex-col gap-6">
        {children}
        {isPending ? (
          <div
            className="absolute inset-0 z-30 flex justify-center rounded-lg bg-background/75 pt-4 backdrop-blur-[1px] supports-backdrop-filter:bg-background/65"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="sr-only">Loading overview</span>
            <div className="h-fit w-full max-w-6xl">
              <WeeklyHeadlineSkeleton />
            </div>
          </div>
        ) : null}
      </div>
    </OverviewRoutePendingContext.Provider>
  )
}
