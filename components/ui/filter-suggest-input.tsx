'use client'

import { Loader2 } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'

import { highlightTextMatch } from '@/lib/format/highlight-text-match'
import {
  rankSuggestOptions,
  type FilterSuggestOption,
} from '@/lib/format/filter-suggest-utils'
import { cn } from '@/lib/utils'

type RoutePendingNavigation = {
  navigateWithTransition: (href: string) => void
  isPending: boolean
}

export function FilterSuggestInput({
  paramKey,
  label,
  placeholder,
  ariaLabel,
  selectedParamValue,
  displayValue,
  suggestions,
  pendingNavigation,
  disabled = false,
  containerClassName,
}: {
  paramKey: string
  label: string
  placeholder: string
  ariaLabel: string
  selectedParamValue: string | null
  displayValue: string
  suggestions: FilterSuggestOption[]
  pendingNavigation?: RoutePendingNavigation | null
  disabled?: boolean
  containerClassName?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  const [localValue, setLocalValue] = useState(displayValue)
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)

  useEffect(() => {
    setLocalValue(displayValue)
  }, [displayValue])

  const visibleSuggestions = useMemo(
    () => rankSuggestOptions(suggestions, localValue, 8),
    [localValue, suggestions]
  )

  const applyNavigation = useCallback(
    (nextParamValue: string) => {
      const trimmed = nextParamValue.trim()
      const current = selectedParamValue?.trim() ?? ''
      if (trimmed === current) return

      const params = new URLSearchParams(searchParams.toString())
      if (trimmed) {
        params.set(paramKey, trimmed)
      } else {
        params.delete(paramKey)
      }
      const query = params.toString()
      const href = query ? `${pathname}?${query}` : pathname

      if (pendingNavigation) {
        pendingNavigation.navigateWithTransition(href)
      } else {
        router.push(href, { scroll: false })
      }
    },
    [paramKey, pathname, pendingNavigation, router, searchParams, selectedParamValue]
  )

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    setHighlightIndex(0)
  }, [localValue, open])

  const selectSuggestion = (option: FilterSuggestOption) => {
    setLocalValue(option.label)
    setOpen(false)
    applyNavigation(option.value)
  }

  const revertDraft = useCallback(() => {
    setLocalValue(displayValue)
  }, [displayValue])

  const onInputChange = (nextValue: string) => {
    setLocalValue(nextValue)
    setOpen(true)

    if (!nextValue.trim() && selectedParamValue) {
      applyNavigation('')
    }
  }

  const onBlur = () => {
    window.setTimeout(() => {
      if (rootRef.current?.contains(document.activeElement)) return

      const trimmed = localValue.trim()

      if (!trimmed) {
        return
      }

      if (trimmed !== displayValue.trim()) {
        setOpen(false)
        revertDraft()
      }
    }, 0)
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true)
      return
    }

    if (event.key === 'Escape') {
      setOpen(false)
      revertDraft()
      return
    }

    if (!open || visibleSuggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightIndex((index) => (index + 1) % visibleSuggestions.length)
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightIndex(
        (index) => (index - 1 + visibleSuggestions.length) % visibleSuggestions.length
      )
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const option = visibleSuggestions[highlightIndex]
      if (option) selectSuggestion(option)
    }
  }

  const isPending = pendingNavigation?.isPending ?? false
  const isDisabled = disabled || isPending || suggestions.length === 0
  const showDropdown = open && visibleSuggestions.length > 0 && !isDisabled

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative flex min-w-[10rem] flex-1 flex-col gap-1.5 sm:max-w-xs',
        containerClassName
      )}
    >
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="relative">
        <input
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls={showDropdown ? listboxId : undefined}
          aria-activedescendant={
            showDropdown ? `${listboxId}-option-${highlightIndex}` : undefined
          }
          value={localValue}
          onChange={(event) => onInputChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          disabled={isDisabled}
          aria-busy={isPending}
          aria-label={ariaLabel}
          placeholder={placeholder}
          className={cn(
            'h-9 w-full rounded-lg border border-border bg-muted/25 py-1.5 pr-8 pl-2.5 text-sm text-foreground',
            'ring-1 ring-foreground/10 placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isDisabled && 'cursor-not-allowed opacity-70'
          )}
        />
        {isPending ? (
          <Loader2
            aria-hidden
            className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          />
        ) : null}

        {showDropdown ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute top-[calc(100%+0.25rem)] z-40 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
          >
            {visibleSuggestions.map((option, index) => (
              <li key={`${paramKey}-${option.value}`} role="presentation">
                <button
                  id={`${listboxId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === highlightIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(option)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-2.5 py-2 text-left text-sm',
                    'hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none',
                    index === highlightIndex && 'bg-muted/60'
                  )}
                >
                  <span className="min-w-0 truncate">
                    {highlightTextMatch(option.label, localValue)}
                  </span>
                  {option.hint ? (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                      {option.hint}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
