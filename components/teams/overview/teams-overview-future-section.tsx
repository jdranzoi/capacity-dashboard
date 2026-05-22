import { TeamsComingSoonCard } from '@/components/teams/_shared/teams-coming-soon-card'

export function TeamsOverviewFutureSection() {
  return (
    <section className="space-y-3" data-slot="teams-overview-future">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Planned dimensions
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <TeamsComingSoonCard
          title="Seniority mix"
          description="Level distribution across the roster (e.g. junior, mid, senior). Requires a seniority field on dim_person or an equivalent controlled vocabulary."
        />
        <TeamsComingSoonCard
          title="Skill composition"
          description="Capability coverage by role and zone. Requires a person-level skills inventory — not available in Supabase v2 today."
        />
      </div>
    </section>
  )
}
