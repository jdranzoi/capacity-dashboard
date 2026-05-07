import { Skeleton } from '@/components/ui/skeleton'

export function WeeklyHeadlineSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-4 w-[480px] max-w-full" />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {Array.from({ length: 7 }).map((_, i) => (
                <th key={i} className="px-4 py-2">
                  <Skeleton className="h-3 w-10 ml-auto" style={i === 0 ? { marginLeft: 0 } : {}} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, row) => (
              <tr key={row} className="border-b border-border/50 last:border-0">
                {Array.from({ length: 7 }).map((_, col) => (
                  <td key={col} className="px-4 py-2.5">
                    <Skeleton className="h-4 w-12 ml-auto" style={col === 0 ? { marginLeft: 0, width: '80px' } : {}} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
