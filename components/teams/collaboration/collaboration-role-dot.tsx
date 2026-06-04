import { roleColorVar } from '@/lib/ui/collaboration-role-colors'
import { cn } from '@/lib/utils'

export function CollaborationRoleDot({
  roleKey,
  className,
}: {
  roleKey: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2 shrink-0 rounded-full', className)}
      style={{ backgroundColor: roleColorVar(roleKey) }}
    />
  )
}
