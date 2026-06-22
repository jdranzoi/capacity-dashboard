import {
  loggedVersusPlannedPct,
  plannedVersusProjectedVariancePct,
  projectedVersusBudgetVariancePct,
} from '@/lib/domain/project-delivery-metrics'
import { fmtHoursKpi, fmtPct, roundDisplayStat } from '@/lib/overview/overview-metrics'
import type { ProjectDetailPanelPayload } from '@/lib/projects/overview/projects-types'

export type ProjectDetailKpiContextTone = 'positive' | 'negative' | 'neutral'

export type ProjectDetailKpiContextLine = {
  text: string
  tone: ProjectDetailKpiContextTone
}

function signedVarianceLine(pct: number | null): ProjectDetailKpiContextLine | undefined {
  if (pct == null) return undefined
  const rounded = roundDisplayStat(pct)
  if (rounded > 0) return { text: `+${rounded}%`, tone: 'positive' }
  if (rounded < 0) return { text: `${rounded}%`, tone: 'negative' }
  return { text: '0%', tone: 'neutral' }
}

function ratioLine(pct: number | null): ProjectDetailKpiContextLine | undefined {
  if (pct == null) return undefined
  return { text: fmtPct(pct), tone: 'neutral' }
}

export function buildProjectDetailKpiContextLines(
  detail: ProjectDetailPanelPayload
): Record<'projected' | 'planned' | 'logged', ProjectDetailKpiContextLine | undefined> {
  return {
    projected: signedVarianceLine(
      projectedVersusBudgetVariancePct(
        detail.projectedHoursAtCompletion,
        detail.budgetHours
      )
    ),
    planned: signedVarianceLine(
      plannedVersusProjectedVariancePct(
        detail.plannedHoursTotal,
        detail.projectedHoursAtCompletion
      )
    ),
    logged: ratioLine(
      loggedVersusPlannedPct(detail.loggedHoursTotal, detail.plannedHoursTotal)
    ),
  }
}
