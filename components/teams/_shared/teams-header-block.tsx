import { Button } from '@/components/ui/button'

export function TeamsHeaderBlock({
  title,
  subtitle,
  referenceMonthLabel,
}: {
  title: string
  subtitle: string
  referenceMonthLabel?: string
}) {
  return (
    <header
      className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"
      data-slot="teams-header"
    >
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {subtitle}
          {referenceMonthLabel ? ` — ${referenceMonthLabel}` : ''}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" className="shrink-0" disabled>
        Export
      </Button>
    </header>
  )
}
