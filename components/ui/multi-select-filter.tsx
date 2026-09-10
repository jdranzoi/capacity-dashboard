'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

import { TOOLBAR_FIELD_LABEL_CLASS } from '@/lib/ui/toolbar-field-label'
import { cn } from '@/lib/utils'

export type MultiSelectFilterOption<T extends string = string> = {
  value: T
  label: string
}

export function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
  allLabel = 'All',
  ariaLabel,
}: {
  label: string
  options: readonly MultiSelectFilterOption<T>[]
  selected: readonly T[]
  onChange: (next: T[]) => void
  allLabel?: string
  ariaLabel?: string
}) {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selectedSet = new Set(selected)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = (value: T) => {
    if (selectedSet.has(value)) onChange(selected.filter((item) => item !== value))
    else onChange([...selected, value])
  }

  const triggerLabel = (() => {
    if (selected.length === 0) return allLabel
    if (selected.length === options.length) return allLabel
    const labels = options.filter((option) => selectedSet.has(option.value)).map((option) => option.label)
    if (labels.length === 1) return labels[0]
    if (labels.length === 2) return labels.join(', ')
    return `${labels[0]} +${labels.length - 1}`
  })()

  return (
    <div ref={rootRef} className="relative flex min-w-38 flex-col gap-1">
      <span className={TOOLBAR_FIELD_LABEL_CLASS}>{label}</span>
      <button
        type="button"
        id={`${listboxId}-trigger`}
        aria-label={ariaLabel ?? label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex h-8 w-full min-w-38 cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-muted/25 py-1.5 pr-2 pl-2.5 text-xs text-foreground',
          'ring-1 ring-foreground/10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable
          aria-labelledby={`${listboxId}-trigger`}
          className="absolute top-[calc(100%+0.25rem)] right-0 z-50 min-w-full overflow-hidden rounded-lg border border-border bg-popover py-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10"
        >
          {options.map((option) => {
            const isSelected = selectedSet.has(option.value)
            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/40"
                >
                  <Check
                    aria-hidden
                    className={cn('size-3.5 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')}
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
