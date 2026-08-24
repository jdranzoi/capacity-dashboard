import { roundDisplayStat } from '@/lib/format/display-stats'

export type LoggedHoursByCommercial = {
  nonCommercialLoggedHoursMtd: number
  commercialLoggedHoursMtd: number
}

type WorklogSlice = {
  logged_seconds: number
  is_commercial: boolean
}

/**
 * Sums non-PTO logged hours by `fact_worklogs.is_commercial` (stamped at sync from Jira category).
 * Commercial vs non-commercial is independent of Tempo `is_billable`.
 */
export function sumLoggedHoursByCommercial(
  worklogs: WorklogSlice[]
): LoggedHoursByCommercial {
  let nonCommercial = 0
  let commercial = 0
  for (const row of worklogs) {
    const hours = Number(row.logged_seconds) / 3600
    if (row.is_commercial) {
      commercial += hours
    } else {
      nonCommercial += hours
    }
  }
  return {
    nonCommercialLoggedHoursMtd: roundDisplayStat(nonCommercial),
    commercialLoggedHoursMtd: roundDisplayStat(commercial),
  }
}
