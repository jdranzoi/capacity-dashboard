import { Badge } from '@/components/ui/badge'

export function TrainingMissingBadge({ label }: { label: string }) {
  return (
    <Badge variant="warning" data-slot="training-missing-badge">
      {label}
    </Badge>
  )
}
