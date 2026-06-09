import {
  KpiMetricCard,
  KpiMetricSubline,
} from '@/components/dashboard/kpi-metric-card'
import type { CollaborationKpis } from '@/lib/teams/collaboration/collaboration-types'
import { cn } from '@/lib/utils'

function projectsByTypeSubline(kpis: CollaborationKpis): string {
  if (kpis.projectsByType.length === 0) return 'No planned projects this month'
  return kpis.projectsByType.map((row) => `${row.label}: ${row.count}`).join(' · ')
}

export function CollaborationKpiRow({ kpis }: { kpis: CollaborationKpis }) {
  return (
    <section className="space-y-3" data-slot="collaboration-kpis">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Network snapshot
      </p>
      <div
        className={cn(
          'grid gap-3 sm:grid-cols-2 sm:items-stretch lg:grid-cols-3 xl:grid-cols-6'
        )}
      >
        <KpiMetricCard
          label="Active collaborators"
          value={kpis.activeCollaborators}
          subline={<KpiMetricSubline>People with plan assignments this month</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Total projects"
          value={kpis.totalProjects}
          subline={<KpiMetricSubline>{projectsByTypeSubline(kpis)}</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Avg. connections"
          value={kpis.avgConnections.toFixed(1)}
          subline={<KpiMetricSubline>Unique collaborators per person</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Most connected TL"
          value={kpis.mostConnectedTl ? kpis.mostConnectedTl.name : '—'}
          subline={
            <KpiMetricSubline>
              {kpis.mostConnectedTl
                ? `${kpis.mostConnectedTl.connections} collaborators`
                : 'No Technical Lead activity'}
            </KpiMetricSubline>
          }
        />
        <KpiMetricCard
          label="Stable squads"
          value="—"
          subline={<KpiMetricSubline>Squad detection — future iteration</KpiMetricSubline>}
        />
        <KpiMetricCard
          label="Collaboration density"
          value={`${kpis.collaborationDensityPct}%`}
          subline={<KpiMetricSubline>Existing vs possible connections</KpiMetricSubline>}
        />
      </div>
    </section>
  )
}
