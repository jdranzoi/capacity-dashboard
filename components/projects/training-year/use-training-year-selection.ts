'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useResolvedSectionRoutePending } from '@/components/ui/use-resolved-section-route-pending'

export function useTrainingYearSelection() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const pending = useResolvedSectionRoutePending()

  const setSelection = useCallback(
    (
      paramKey: 'month' | 'role' | 'version' | 'component',
      key: string,
      selectedKey: string | null
    ) => {
      const next = new URLSearchParams(searchParams.toString())
      if (selectedKey === key) next.delete(paramKey)
      else next.set(paramKey, key)
      // A version scopes the area list, so a stale area would leave an empty slice.
      if (paramKey === 'version') next.delete('component')
      const query = next.toString()
      const href = query ? `${pathname}?${query}` : pathname
      if (pending) pending.navigateWithTransition(href)
      else router.push(href, { scroll: false })
    },
    [pathname, pending, router, searchParams]
  )

  return setSelection
}
