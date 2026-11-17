'use client'

import { useState, type ReactNode } from 'react'

import {
  PlannedLoggedBarLegend,
  PlannedLoggedProgressBar,
} from '@/components/projects/overview/planned-logged-progress-bar'
import { fmtHoursKpi } from '@/lib/overview/overview-metrics'
import { projectOverrunHours } from '@/lib/domain/project-delivery-metrics'
import type {
  ProjectDetailTeamPersonHours,
  ProjectDetailTeamRoleHours,
} from '@/lib/projects/overview/projects-types'
import { cn } from '@/lib/utils'

const VISIBLE_PEOPLE = 4

const ROW_GRID =
  'grid grid-cols-[minmax(0,11rem)_3.25rem_3.25rem_minmax(12rem,1fr)] items-center gap-x-3'

function HoursCell({ hours }: { hours: number }) {
  return (
    <span className="text-right font-mono text-[0.65rem] tabular-nums text-muted-foreground">
      {hours > 0 ? fmtHoursKpi(hours) : '—'}
    </span>
  )
}

function ContractorTag() {
  return (
    <span
      data-slot="projects-team-contractor-tag"
      className="ml-1.5 rounded-sm border border-border px-1 py-px align-middle text-[0.55rem] font-medium uppercase tracking-wide text-muted-foreground"
    >
      Contractor
    </span>
  )
}

function HoursRow({
  label,
  tag,
  plannedHours,
  loggedHours,
  scaleMaxHours,
  barHeightClass,
  labelClassName,
}: {
  label: string
  tag?: ReactNode
  plannedHours: number
  loggedHours: number
  scaleMaxHours: number
  barHeightClass: string
  labelClassName: string
}) {
  return (
    <div className={ROW_GRID}>
      <span className={cn('min-w-0 truncate', labelClassName)}>
        {label}
        {tag}
      </span>
      <HoursCell hours={plannedHours} />
      <HoursCell hours={loggedHours} />
      <PlannedLoggedProgressBar
        plannedHours={plannedHours}
        loggedHours={loggedHours}
        overrunHours={projectOverrunHours(loggedHours, plannedHours)}
        scaleMaxHours={scaleMaxHours}
        trackClassName={barHeightClass}
      />
    </div>
  )
}

function RolePeopleList({
  people,
  scaleMaxHours,
}: {
  people: readonly ProjectDetailTeamPersonHours[]
  scaleMaxHours: number
}) {
  const [expanded, setExpanded] = useState(false)
  const hiddenCount = Math.max(0, people.length - VISIBLE_PEOPLE)
  const visible = expanded || hiddenCount === 0 ? people : people.slice(0, VISIBLE_PEOPLE)

  return (
    <div className="space-y-1">
      <ul className="list-none space-y-1 p-0">
        {visible.map((person) => (
          <li key={person.personId}>
            <HoursRow
              label={person.personName}
              tag={person.isContractor ? <ContractorTag /> : null}
              plannedHours={person.plannedHours}
              loggedHours={person.loggedHours}
              scaleMaxHours={scaleMaxHours}
              barHeightClass="h-1.5"
              labelClassName="pl-3 text-[0.7rem] text-muted-foreground"
            />
          </li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="cursor-pointer pl-3 text-[0.65rem] text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? 'Show fewer' : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </div>
  )
}

export function ProjectTeamRoleHours({
  roles,
  ariaLabel,
}: {
  roles: readonly ProjectDetailTeamRoleHours[]
  ariaLabel: string
}) {
  if (roles.length === 0) {
    return <p className="text-xs text-muted-foreground">No role hours for this period.</p>
  }

  const projectScale = Math.max(
    1,
    ...roles.map((row) => Math.max(row.plannedHours, row.loggedHours))
  )
  const totalPlannedHours = roles.reduce((sum, row) => sum + row.plannedHours, 0)
  const totalLoggedHours = roles.reduce((sum, row) => sum + row.loggedHours, 0)

  return (
    <div className="space-y-3" aria-label={ariaLabel}>
      <PlannedLoggedBarLegend />
      <div className={ROW_GRID}>
        <span />
        <span className="text-right text-[0.6rem] font-medium uppercase tracking-wide text-muted-foreground">
          Plan
        </span>
        <span className="text-right text-[0.6rem] font-medium uppercase tracking-wide text-muted-foreground">
          Log
        </span>
        <span />
      </div>

      <ul className="list-none divide-y divide-border/60 p-0">
        {roles.map((row) => (
          <li key={row.roleKey} className="space-y-1.5 py-3 first:pt-0 last:pb-0">
            <HoursRow
              label={row.roleLabel}
              plannedHours={row.plannedHours}
              loggedHours={row.loggedHours}
              scaleMaxHours={projectScale}
              barHeightClass="h-2"
              labelClassName="text-xs font-medium text-foreground"
            />
            {row.people.length > 0 ? (
              <RolePeopleList people={row.people} scaleMaxHours={projectScale} />
            ) : null}
          </li>
        ))}
      </ul>

      {/* Total bar uses its own scale: summed hours exceed every role row. */}
      <div className="border-t border-border pt-3" data-slot="projects-team-role-hours-total">
        <HoursRow
          label="Total"
          plannedHours={totalPlannedHours}
          loggedHours={totalLoggedHours}
          scaleMaxHours={Math.max(1, totalPlannedHours, totalLoggedHours)}
          barHeightClass="h-2"
          labelClassName="text-xs font-semibold text-foreground"
        />
      </div>
    </div>
  )
}
