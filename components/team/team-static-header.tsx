import { Button } from '@/components/ui/button'

export function TeamStaticHeader({ referenceMonthLabel }: { referenceMonthLabel?: string }) {
  return (
    <header
      className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"
      data-slot="team-header"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Teams</h1>
        <p className="text-sm text-muted-foreground">
          Team utilization and staffing
          {referenceMonthLabel ? ` — ${referenceMonthLabel}` : ''}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" className="shrink-0" disabled>
        Export
      </Button>
    </header>
  )
}
