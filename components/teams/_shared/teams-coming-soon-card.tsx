export function TeamsComingSoonCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div
      className="flex min-h-[8.5rem] flex-col justify-between rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10"
      data-slot="teams-coming-soon-card"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium tracking-tight">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Coming soon — no data source in Supabase v2 yet
      </p>
    </div>
  )
}
