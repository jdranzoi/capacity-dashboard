'use client'

import { useId, useState } from 'react'
import { cva } from 'class-variance-authority'

import {
  DataSectionPanel,
  DataSectionPanelHeader,
  DataSectionPanelTotalBadge,
} from '@/components/ui/data-section-panel'
import { fmtHeadcountKpi } from '@/lib/overview/overview-metrics'
import type { TeamsRoleRoster } from '@/lib/teams/overview/load-teams-overview'

const roleButtonVariants = cva(
  'flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors duration-150',
  {
    variants: {
      selected: {
        true: 'border-border bg-card text-foreground shadow-sm ring-1 ring-foreground/10',
        false:
          'border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground',
      },
    },
  }
)

export function TeamsOverviewRosterSection({ roster }: { roster: TeamsRoleRoster[] }) {
  const listId = useId()
  const [selectedKey, setSelectedKey] = useState<string | null>(roster[0]?.key ?? null)
  const selected = roster.find((role) => role.key === selectedKey) ?? roster[0] ?? null

  return (
    <section className="space-y-3" data-slot="teams-overview-roster">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Roster
      </p>
      <DataSectionPanel dataSlot="teams-overview-roster-panel">
        <DataSectionPanelHeader
          title="People by role"
          description="Select a role to list the people who held it this month."
          aside={
            selected ? (
              <DataSectionPanelTotalBadge
                label={selected.label}
                value={fmtHeadcountKpi(selected.members.length)}
                ariaLabel={`${selected.label}: ${fmtHeadcountKpi(selected.members.length)} people`}
              />
            ) : null
          }
        />

        {selected == null ? (
          <p className="mt-3 text-xs text-muted-foreground">No roster members for this month.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(12rem,15rem)_minmax(0,1fr)]">
            <ul
              className="grid list-none grid-cols-2 gap-1 p-0 sm:grid-cols-3 md:grid-cols-1"
              aria-label="Roles"
              data-slot="teams-overview-roster-roles"
            >
              {roster.map((role) => {
                const isSelected = role.key === selected.key
                return (
                  <li key={role.key}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-controls={listId}
                      onClick={() => setSelectedKey(role.key)}
                      className={roleButtonVariants({ selected: isSelected })}
                    >
                      <span className="min-w-0 truncate font-medium">{role.label}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums">
                        {fmtHeadcountKpi(role.members.length)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <ul
              id={listId}
              aria-live="polite"
              aria-label={`People in ${selected.label}`}
              className="list-none columns-1 gap-x-8 p-0 sm:columns-2 lg:columns-3"
              data-slot="teams-overview-roster-people"
            >
              {selected.members.map((name) => (
                <li
                  key={name}
                  className="break-inside-avoid border-b border-border py-1.5 text-sm text-foreground"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </DataSectionPanel>
    </section>
  )
}
