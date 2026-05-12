import { TeamMonthPicker } from '@/components/team/team-month-picker'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'
import { cn } from '@/lib/utils'

const FILTER_LABELS = ['Team', 'Role', 'Client', 'Project', 'Region'] as const

export function TeamToolbar({
  monthPicker,
}: {
  monthPicker: { options: OverviewMonthOption[]; selectedMonthKey: string } | null
}) {
  return (
    <div
      className="flex flex-wrap items-end gap-3 border-b border-border/80 pb-5"
      data-slot="team-toolbar"
    >
      <div className="flex min-w-[11.5rem] flex-col gap-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Period
        </span>
        {monthPicker && monthPicker.options.length > 0 ? (
          <TeamMonthPicker
            options={monthPicker.options}
            selectedMonthKey={monthPicker.selectedMonthKey}
          />
        ) : (
          <div className="h-9 min-w-[11.5rem] rounded-lg border border-border bg-muted/20" />
        )}
      </div>

      {FILTER_LABELS.map((label) => (
        <div key={label} className="flex min-w-[7.5rem] flex-col gap-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <select
            aria-label={`${label} filter (coming soon)`}
            disabled
            className={cn(
              'h-9 w-full cursor-not-allowed rounded-lg border border-border bg-muted/15 py-1.5 pr-8 pl-2.5 text-sm text-muted-foreground',
              'opacity-70'
            )}
            defaultValue="all"
          >
            <option value="all">All</option>
          </select>
        </div>
      ))}
    </div>
  )
}
