import {
  compositionSectionId,
  type TeamsCompositionPayload,
} from '@/lib/teams/composition/teams-composition-utils'
import { cn } from '@/lib/utils'

export function TeamsCompositionTypeNav({ data }: { data: TeamsCompositionPayload }) {
  return (
    <nav aria-label="Project type sections" data-slot="teams-composition-type-nav">
      <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {data.groups.map((group) => {
          const count = group.projects.length
          const isEmpty = count === 0

          return (
            <a
              key={group.projectType}
              href={`#${compositionSectionId(group.projectType)}`}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                'ring-1 ring-transparent hover:bg-muted/50 hover:ring-foreground/10',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isEmpty && 'text-muted-foreground'
              )}
            >
              <span>{group.label}</span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {count}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
