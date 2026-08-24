import { Flag } from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoleBadge } from '@/components/ui/role-badge'
import { highlightTextMatch } from '@/lib/format/highlight-text-match'
import { roleKeyAcronym } from '@/lib/domain/role-keys'
import type { TeamsCompositionProject } from '@/lib/teams/composition/teams-composition-utils'
import { cn } from '@/lib/utils'

export function TeamsCompositionProjectCard({
  project,
  personQuery,
  projectQuery,
  highlightPmPersonId = null,
}: {
  project: TeamsCompositionProject
  personQuery: string | null
  projectQuery: string | null
  highlightPmPersonId?: string | null
}) {
  const rows = project.memberGroups.flatMap((group) =>
    group.members.map((member) => ({
      key: member.personId,
      personId: member.personId,
      roleKey: member.roleKey,
      roleLabel: group.roleLabel,
      personName: member.personName,
    }))
  )
  const sharedPmCount = project.pmMembers.length
  const isSharedAcrossPms = Boolean(highlightPmPersonId && sharedPmCount > 1)
  const sharedPmIds = isSharedAcrossPms
    ? new Set(project.pmMembers.map((pm) => pm.personId))
    : null

  return (
    <Card
      size="sm"
      className="h-full"
      data-slot="teams-composition-project-card"
    >
      <CardHeader className="border-b border-border/60 px-3 pb-2">
        <CardTitle className="min-w-0 truncate whitespace-nowrap text-sm leading-snug tracking-tight">
          <span className="font-mono">
            {highlightTextMatch(project.projectKey, projectQuery)}
          </span>
          {project.projectName?.trim() &&
          project.projectName.trim() !== project.projectKey ? (
            <>
              <span className="font-sans text-muted-foreground"> — </span>
              <span className="font-sans font-medium">
                {highlightTextMatch(project.projectName.trim(), projectQuery)}
              </span>
            </>
          ) : null}
        </CardTitle>
        {isSharedAcrossPms ? (
          <p
            className="mt-1 flex items-center gap-1 text-[11px] leading-none text-[var(--team-util-tone-amber)]"
            title="This project is listed under each of its project managers."
          >
            <Flag className="size-3 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">
              Listed under {sharedPmCount} PMs
            </span>
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="px-3 pt-2">
        {rows.length === 0 ? (
          <p className="truncate text-xs text-muted-foreground">
            No planned assignments for this month.
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.map((row) => {
              const isSharedPm = Boolean(sharedPmIds?.has(row.personId))
              const isSectionPm =
                isSharedPm && row.personId === highlightPmPersonId

              return (
                <li
                  key={row.key}
                  className={cn(
                    'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 whitespace-nowrap text-sm leading-none',
                    isSharedPm &&
                      'rounded-sm bg-[color-mix(in_oklch,var(--team-util-tone-amber)_12%,transparent)] px-1 py-0.5 -mx-1'
                  )}
                >
                  <RoleBadge
                    roleKey={row.roleKey}
                    className="px-1.5 font-mono uppercase tracking-wide"
                  >
                    <span title={row.roleLabel}>{roleKeyAcronym(row.roleKey)}</span>
                  </RoleBadge>
                  <span
                    className={cn(
                      'flex min-w-0 items-center justify-end gap-1 text-foreground',
                      isSharedPm && 'font-medium'
                    )}
                  >
                    {isSharedPm ? (
                      <Badge
                        variant="warning"
                        className="h-4 shrink-0 gap-0.5 px-1 text-[9px] font-medium uppercase tracking-wide"
                        title={
                          isSectionPm
                            ? 'Project manager for this section'
                            : 'Also listed under this project manager'
                        }
                      >
                        <Flag className="size-2.5" aria-hidden />
                        {isSectionPm ? 'This section' : 'Also listed'}
                      </Badge>
                    ) : null}
                    <span className="min-w-0 truncate">
                      {highlightTextMatch(row.personName, personQuery)}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
