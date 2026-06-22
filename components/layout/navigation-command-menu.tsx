'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

import { useNavigationSearch } from '@/components/layout/navigation-search-context'
import { isSidebarNavItemVisible } from '@/lib/navigation/sidebar-nav-config'
import {
  searchNavigation,
  type NavigationSearchEntry,
} from '@/lib/navigation/search-navigation'
import { cn } from '@/lib/utils'

function NavigationSearchResult({
  entry,
  active,
  onSelect,
}: {
  entry: NavigationSearchEntry
  active: boolean
  onSelect: () => void
}) {
  const Icon = entry.icon
  const disabled = !isSidebarNavItemVisible(entry.href, entry.status)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors duration-150',
        active ? 'bg-accent text-foreground' : 'text-foreground hover:bg-accent/70',
        disabled && 'pointer-events-none opacity-45'
      )}
    >
      {Icon ? (
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <span className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium leading-snug">{entry.label}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {entry.breadcrumb}
        </span>
      </span>
    </button>
  )
}

export function NavigationSearchTrigger({
  collapsed = false,
  className,
}: {
  collapsed?: boolean
  className?: string
}) {
  const { setOpen } = useNavigationSearch()

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search menu"
      title={collapsed ? "Search menu (⌘K)" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md border border-sidebar-border bg-muted/20 text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent hover:text-foreground",
        collapsed
          ? "mx-auto h-8 w-8 justify-center px-0"
          : "h-8 w-full px-2.5 text-xs",
        className,
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      {!collapsed ? (
        <>
          <span className="flex-1 truncate text-left">Search menu…</span>
          <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </>
      ) : null}
    </button>
  );
}

export function NavigationCommandDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const results = useMemo(() => searchNavigation(query), [query])

  const close = useCallback(() => {
    onOpenChange(false)
    setQuery('')
    setActiveIndex(0)
  }, [onOpenChange])

  const navigate = useCallback(
    (entry: NavigationSearchEntry) => {
      if (!isSidebarNavItemVisible(entry.href, entry.status)) return
      router.push(entry.href)
      close()
    },
    [router, close]
  )

  useEffect(() => {
    if (!open) return
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query])

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, results.length - 1)))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        return
      }

      if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault()
        navigate(results[activeIndex])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, close, results, activeIndex, navigate])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={close}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search navigation"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
      >
        <div className="flex items-center gap-3 border-b border-border px-3">
          <Search
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search menu by title or description…"
            className="h-11 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>

        <div className="max-h-[min(24rem,50vh)] overflow-y-auto p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches
            </p>
          ) : (
            results.map((entry, index) => (
              <NavigationSearchResult
                key={`${entry.href}-${entry.label}`}
                entry={entry}
                active={index === activeIndex}
                onSelect={() => navigate(entry)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
