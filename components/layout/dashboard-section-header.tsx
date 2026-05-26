import type { ReactNode } from 'react'

export function DashboardSectionHeader({
  title,
  subtitle,
  filters,
}: {
  title: string
  subtitle?: string
  filters?: ReactNode
}) {
  return (
    <header
      className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between"
      data-slot="dashboard-section-header"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {filters ? <div className="shrink-0">{filters}</div> : null}
    </header>
  )
}
