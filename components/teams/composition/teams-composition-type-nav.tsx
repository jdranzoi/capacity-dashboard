import { cn } from '@/lib/utils'

export type TeamsCompositionAnchorItem = {
  id: string
  label: string
  count: number
}

export function TeamsCompositionAnchorNav({
  items,
  ariaLabel,
}: {
  items: TeamsCompositionAnchorItem[]
  ariaLabel: string
}) {
  return (
    <nav aria-label={ariaLabel} data-slot="teams-composition-anchor-nav">
      <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isEmpty = item.count === 0

          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "inline-flex shrink-0 items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors",
                "ring-1 ring-transparent hover:bg-muted/50 hover:ring-foreground/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isEmpty && "text-muted-foreground",
              )}
            >
              <span>{item.label}</span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                {item.count}
              </span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
