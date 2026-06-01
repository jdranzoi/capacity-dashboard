'use client'

import {
  createContext,
  useCallback,
  useContext,
  useTransition,
  type ReactNode,
} from 'react'

import { useRouter } from 'next/navigation'

type ProjectsRoutePendingValue = {
  navigateWithTransition: (href: string) => void
  isPending: boolean
}

const ProjectsRoutePendingContext = createContext<ProjectsRoutePendingValue | null>(null)

export function useProjectsRoutePending(): ProjectsRoutePendingValue | null {
  return useContext(ProjectsRoutePendingContext)
}

export function ProjectsRoutePendingShell({ children }: { children: ReactNode }) {
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
    <ProjectsRoutePendingContext.Provider value={{ navigateWithTransition, isPending }}>
      <div
        className="flex min-h-[50vh] flex-col gap-8"
        aria-busy={isPending}
        aria-live="polite"
      >
        {children}
      </div>
    </ProjectsRoutePendingContext.Provider>
  )
}
