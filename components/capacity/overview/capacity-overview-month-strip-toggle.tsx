'use client'

import { useId, useState, type ReactNode } from 'react'

import { SegmentedControl } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'

const VISIBILITY_OPTIONS = [
  { value: 'show', label: 'Show' },
  { value: 'hide', label: 'Hide' },
] as const

export function CapacityOverviewMonthStripToggle({
  asOfDate,
  children,
}: {
  asOfDate: string | null
  children: ReactNode
}) {
  const [visible, setVisible] = useState(true)
  const panelId = useId()

  return (
    <section data-slot="capacity-overview-month-strip">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          This month
          {asOfDate ? (
            <span className="ml-2 font-normal normal-case tracking-normal text-[0.7rem]">
              as of {asOfDate}
            </span>
          ) : null}
        </h2>
        <SegmentedControl
          label="This month visibility"
          hideLabel
          value={visible ? 'show' : 'hide'}
          onChange={(next) => setVisible(next === 'show')}
          options={VISIBILITY_OPTIONS}
        />
      </div>
      <div
        id={panelId}
        aria-hidden={!visible}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
          visible ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div
          className={cn(
            'overflow-hidden transition-opacity duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
            visible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </section>
  )
}
