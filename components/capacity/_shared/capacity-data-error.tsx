export function CapacityDataError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}

export function CapacityEmptyMonths() {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
      No historical months in <code className="font-mono text-xs">fact_capacity</code> yet. Run a
      sync, then refresh.
    </div>
  )
}
