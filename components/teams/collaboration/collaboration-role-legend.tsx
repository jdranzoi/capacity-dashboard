'use client'

import { CollaborationRoleDot } from '@/components/teams/collaboration/collaboration-role-dot'
import { cn } from '@/lib/utils'

export function CollaborationRoleLegend({
  roles,
  visibleRoleKeys,
  onToggleRole,
  onShowAll,
  onHideAll,
}: {
  roles: { key: string; label: string }[]
  visibleRoleKeys: ReadonlySet<string>
  onToggleRole: (roleKey: string) => void
  onShowAll: () => void
  onHideAll: () => void
}) {
  if (roles.length === 0) return null

  const allVisible = roles.every((role) => visibleRoleKeys.has(role.key))
  const noneVisible = roles.every((role) => !visibleRoleKeys.has(role.key))

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-border px-3 py-2 text-[var(--collab-role-legend-fg)]"
      style={{ backgroundColor: 'var(--collab-role-legend-bg)' }}
      data-slot="collaboration-role-legend"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-[var(--collab-role-legend-muted)]">
          Roles
        </span>
        <div className="flex gap-2 text-[0.7rem]">
          <button
            type="button"
            disabled={allVisible}
            onClick={onShowAll}
            className="text-[var(--collab-role-legend-muted)] hover:text-[var(--collab-role-legend-fg)] disabled:opacity-40"
          >
            Show all
          </button>
          <button
            type="button"
            disabled={noneVisible}
            onClick={onHideAll}
            className="text-[var(--collab-role-legend-muted)] hover:text-[var(--collab-role-legend-fg)] disabled:opacity-40"
          >
            Hide all
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {roles.map((role) => {
          const checked = visibleRoleKeys.has(role.key)
          return (
            <label
              key={role.key}
              className={cn(
                'flex cursor-pointer items-center gap-2 text-[0.72rem] transition-opacity',
                checked
                  ? 'text-[var(--collab-role-legend-fg)]'
                  : 'text-[var(--collab-role-legend-muted)] opacity-55'
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggleRole(role.key)}
                className="size-3.5 rounded border-border accent-foreground"
              />
              <CollaborationRoleDot roleKey={role.key} />
              <span>{role.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
