'use client'

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
 * Pair with `OverviewRouteSection` per slot — section fallbacks replace stale content while pending.
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
      <div
        className="flex min-h-[50vh] flex-col gap-6"
        aria-busy={isPending}
        aria-live="polite"
      >
        {children}
      </div>
    </OverviewRoutePendingContext.Provider>
  )
}
