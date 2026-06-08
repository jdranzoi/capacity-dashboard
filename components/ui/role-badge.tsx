import type { ReactNode } from 'react'

import { roleColorVar } from '@/lib/ui/collaboration-role-colors'
import { cn } from '@/lib/utils'

/**
 * Pill badge tinted by `dim_role.key` via `--collab-role-*` / `--collab-palette-*` tokens.
 * Use anywhere role-colored labels are needed (collaboration, composition, project detail, etc.).
 */
export function RoleBadge({
  roleKey,
  children,
  className,
}: {
  roleKey: string
  children: ReactNode
  className?: string
}) {
  const color = roleColorVar(roleKey)

  return (
    <span
      data-slot="role-badge"
      className={cn(
        'inline-flex max-w-full shrink-0 items-center rounded-md px-2 py-0.5 text-[0.65rem] font-medium leading-none [--role-bg-mix:14%] dark:[--role-bg-mix:24%]',
        className
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} var(--role-bg-mix), transparent)`,
        color,
      }}
    >
      <span className="truncate">{children}</span>
    </span>
  )
}
