'use client'

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from 'react'

import { useRouter } from 'next/navigation'

type CapacityRoutePendingValue = {
  navigateWithTransition: (href: string) => void
  isPending: boolean
}

const CapacityRoutePendingContext = createContext<CapacityRoutePendingValue | null>(null)

export function useCapacityRoutePending(): CapacityRoutePendingValue | null {
  return useContext(CapacityRoutePendingContext)
}

/**
 * Wraps `/capacity/*` routes so month/filter navigations use `useTransition`.
 * Pair with `CapacityRouteSection` per slot for in-place section skeletons while pending.
 */
export function CapacityRoutePendingShell({ children }: { children: ReactNode }) {
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
    <CapacityRoutePendingContext.Provider value={{ navigateWithTransition, isPending }}>
      <div
        className="flex min-h-[50vh] flex-col gap-8"
        aria-busy={isPending}
        aria-live="polite"
      >
        {children}
      </div>
    </CapacityRoutePendingContext.Provider>
  )
}
