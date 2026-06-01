/**
 * Per-row progress bar layout: track is always 100% width.
 * - Under plan: scale = planned; logged fill + planned remainder.
 * - Overrun: scale = logged; full logged fill + marker at planned share.
 */

export type PlannedLoggedBarLayout = {
  loggedWidthPct: number
  plannedMarkerPct: number | null
  /** Width % of logged bar beyond the plan marker (overrun only). */
  overrunWidthPct: number
  showPlannedTrack: boolean
  isOverrun: boolean
}

export function layoutPlannedLoggedBar(
  plannedHours: number,
  loggedHours: number
): PlannedLoggedBarLayout {
  if (plannedHours <= 0 && loggedHours <= 0) {
    return {
      loggedWidthPct: 0,
      plannedMarkerPct: null,
      overrunWidthPct: 0,
      showPlannedTrack: false,
      isOverrun: false,
    }
  }

  if (plannedHours <= 0 && loggedHours > 0) {
    return {
      loggedWidthPct: 100,
      plannedMarkerPct: null,
      overrunWidthPct: 0,
      showPlannedTrack: false,
      isOverrun: false,
    }
  }

  if (loggedHours > plannedHours) {
    const plannedMarkerPct = (plannedHours / loggedHours) * 100
    return {
      loggedWidthPct: 100,
      plannedMarkerPct,
      overrunWidthPct: 100 - plannedMarkerPct,
      showPlannedTrack: false,
      isOverrun: true,
    }
  }

  return {
    loggedWidthPct: plannedHours > 0 ? (loggedHours / plannedHours) * 100 : 0,
    plannedMarkerPct: null,
    overrunWidthPct: 0,
    showPlannedTrack: plannedHours > 0,
    isOverrun: false,
  }
}
