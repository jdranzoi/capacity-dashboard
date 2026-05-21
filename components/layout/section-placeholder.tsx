type SectionPlaceholderProps = {
  section: string
  subsection: string
  description?: string
}

export function SectionPlaceholder({
  section,
  subsection,
  description = 'This view is planned for Phase 1. Data loaders and UI will ship in a later subplan.',
}: SectionPlaceholderProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <header className="flex flex-col gap-1 border-b border-border pb-6">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {section}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{subsection}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      </header>
      <div
        className="flex min-h-[12rem] items-center justify-center rounded-lg border border-dashed border-border bg-muted/15 px-6 py-12 text-center text-sm text-muted-foreground"
        data-slot="section-placeholder"
      >
        Coming soon
      </div>
    </div>
  )
}
