'use client'

import { Badge } from '@/components/ui/badge'
import {
  fragmentationLabelBadgeVariant,
  fragmentationLabelHint,
  type FragmentationLabel,
} from '@/lib/domain/fragmentation-label'
import { cn } from '@/lib/utils'

export function FragmentationLabelBadge({
  label,
  className,
}: {
  label: FragmentationLabel
  className?: string
}) {
  return (
    <Badge
      variant={fragmentationLabelBadgeVariant(label)}
      className={cn('h-4 shrink-0 px-1.5 text-[10px] leading-none', className)}
      title={fragmentationLabelHint(label)}
    >
      {label}
    </Badge>
  )
}
