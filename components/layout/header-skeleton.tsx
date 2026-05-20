export function HeaderSkeleton() {
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between border-b bg-background/80 px-6 backdrop-blur-sm"
      aria-hidden
    >
      <div className="h-6 w-36 animate-pulse rounded-full bg-muted/50" />
      <div className="flex items-center gap-2">
        <div className="size-8 animate-pulse rounded-md bg-muted/50" />
        <div className="h-6 w-24 animate-pulse rounded-md bg-muted/50" />
      </div>
    </header>
  )
}
