import { getNavigationEntryByHref } from '@/lib/navigation/search-navigation'

export function CapacityComingSoon({ href }: { href: string }) {
  const entry = getNavigationEntryByHref(href)
  const title = entry?.label ?? 'Section'
  const description =
    entry?.description ??
    'This view is planned for a later Capacity track. See docs/SP2_CAPACITY_PLAN.md.'

  return (
    <div className="flex flex-col gap-4 py-2">
      <header className="flex flex-col gap-1 border-b border-border pb-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Capacity
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>
      <div
        className="flex min-h-[12rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/15 px-6 py-12 text-center text-sm text-muted-foreground"
        data-slot="capacity-coming-soon"
      >
        Coming soon — tracked in{' '}
        <code className="font-mono text-xs">docs/SP2_CAPACITY_PLAN.md</code>
      </div>
    </div>
  )
}
