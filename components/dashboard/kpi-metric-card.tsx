import { cn } from '@/lib/utils'
import type { CSSProperties, ReactNode } from 'react'

/** Shared KPI row grid — matches overview `OverviewKpiCards` (5 columns on xl). */
export const KPI_METRICS_GRID_CLASS =
  'grid gap-3 sm:grid-cols-2 sm:items-stretch xl:grid-cols-5'

export function KpiMetricCard({
  label,
  value,
  subline,
  valueColorVar,
  className,
}: {
  label: string
  value: ReactNode
  subline?: ReactNode
  /** e.g. `--overview-metric-net` — applied as `color: var(...)`. */
  valueColorVar?: string
  className?: string
}) {
  const valueStyle: CSSProperties | undefined = valueColorVar
    ? { color: `var(${valueColorVar})` }
    : undefined

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col rounded-xl bg-card p-3 text-card-foreground ring-1 ring-foreground/10',
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className="mt-1 text-lg font-semibold tabular-nums tracking-tight"
        style={valueStyle}
      >
        {value}
      </p>
      {subline}
    </div>
  )
}

export function KpiMetricSubline({ children }: { children: ReactNode }) {
  return <p className="text-[0.7rem] leading-snug text-muted-foreground">{children}</p>
}
