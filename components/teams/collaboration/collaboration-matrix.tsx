'use client'

import { useMemo } from 'react'

import { collaborationEdgeKey } from '@/lib/teams/collaboration/collaboration-ui-utils'
import { cn } from '@/lib/utils'
import type { CollaborationMatrix } from '@/lib/teams/collaboration/collaboration-types'

function heatBackground(value: number, max: number): string | undefined {
  if (value <= 0 || max <= 0) return undefined
  const pct = 12 + Math.round((value / max) * 76)
  return `color-mix(in oklab, var(--collab-role-tl) ${pct}%, transparent)`
}

export function CollaborationMatrix({
  matrix,
  selectedEdgeKey,
  onSelectCell,
  className,
}: {
  matrix: CollaborationMatrix
  selectedEdgeKey: string | null
  onSelectCell: (key: string) => void
  className?: string
}) {
  const cellValue = useMemo(() => {
    const map = new Map<string, number>()
    for (const cell of matrix.cells) {
      map.set(`${cell.pmId}|${cell.tlId}`, cell.sharedProjects)
    }
    return map
  }, [matrix.cells])

  if (matrix.pms.length === 0 || matrix.tls.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10',
          className
        )}
      >
        Not enough PM and TL collaboration this month to build the matrix.
      </div>
    )
  }

  return (
    <div
      className={cn('rounded-xl bg-card p-4 ring-1 ring-foreground/10', className)}
      data-slot="collaboration-matrix"
    >
      <div className="mb-3 space-y-0.5">
        <h3 className="text-sm font-medium">PM ↔ TL collaboration matrix</h3>
        <p className="text-[0.7rem] text-muted-foreground">
          TL rows × PM columns · shared projects per pair
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-[0.72rem]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-2 py-1 text-left font-medium text-muted-foreground">
                TL \ PM
              </th>
              {matrix.pms.map((pm) => (
                <th
                  key={pm.id}
                  className="px-2 py-1 text-left align-bottom font-medium text-muted-foreground"
                >
                  <span className="block max-w-[6.5rem] truncate">{pm.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.tls.map((tl) => (
              <tr key={tl.id}>
                <th className="sticky left-0 z-10 max-w-[8rem] truncate bg-card px-2 py-1 text-left font-medium">
                  {tl.name}
                </th>
                {matrix.pms.map((pm) => {
                  const value = cellValue.get(`${pm.id}|${tl.id}`) ?? 0
                  const key = collaborationEdgeKey(pm.id, tl.id)
                  const isSelected = value > 0 && key === selectedEdgeKey
                  return (
                    <td key={pm.id} className="p-0">
                      <button
                        type="button"
                        disabled={value <= 0}
                        onClick={() => onSelectCell(key)}
                        style={{ backgroundColor: heatBackground(value, matrix.maxValue) }}
                        className={cn(
                          'flex h-8 w-full min-w-[2.75rem] items-center justify-center rounded-md tabular-nums transition-colors',
                          value > 0
                            ? 'cursor-pointer text-foreground hover:ring-1 hover:ring-foreground/30'
                            : 'cursor-default text-muted-foreground/40',
                          isSelected && 'ring-2 ring-foreground'
                        )}
                      >
                        {value > 0 ? value : '·'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
