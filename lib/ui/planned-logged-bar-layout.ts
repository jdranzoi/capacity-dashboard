/**
 * Per-row progress bar layout: track is always 100% width.
 * - Under plan: scale = planned; logged fill + planned remainder.
 * - Overrun: scale = logged; full logged fill + marker at planned share.
 */

export type PlannedLoggedBarLayout = {
  loggedWidthPct: number
  plannedMarkerPct: number | null
  /** Width % of the planned track. Null means full-width wash (row-local scale). */
  plannedTrackWidthPct: number | null
  /** Width % of logged bar beyond the plan marker (overrun only). */
  overrunWidthPct: number
  showPlannedTrack: boolean
  isOverrun: boolean
}

function emptyLayout(): PlannedLoggedBarLayout {
  return {
    loggedWidthPct: 0,
    plannedMarkerPct: null,
    plannedTrackWidthPct: null,
    overrunWidthPct: 0,
    showPlannedTrack: false,
    isOverrun: false,
  }
}

export function layoutPlannedLoggedBar(
  plannedHours: number,
  loggedHours: number,
  scaleMaxHours?: number
): PlannedLoggedBarLayout {
  if (plannedHours <= 0 && loggedHours <= 0) {
    return emptyLayout()
  }

  if (scaleMaxHours != null && scaleMaxHours > 0) {
    const loggedWidthPct = Math.min(100, (Math.max(0, loggedHours) / scaleMaxHours) * 100)
    const plannedWidthPct =
      plannedHours > 0 ? Math.min(100, (plannedHours / scaleMaxHours) * 100) : 0
    const isOverrun = plannedHours > 0 && loggedHours > plannedHours
    return {
      loggedWidthPct,
      plannedMarkerPct: plannedHours > 0 ? plannedWidthPct : null,
      plannedTrackWidthPct: plannedWidthPct > 0 ? plannedWidthPct : null,
      overrunWidthPct: isOverrun ? Math.max(0, loggedWidthPct - plannedWidthPct) : 0,
      showPlannedTrack: plannedWidthPct > 0,
      isOverrun,
    }
  }

  if (plannedHours <= 0 && loggedHours > 0) {
    return {
      loggedWidthPct: 100,
      plannedMarkerPct: null,
      plannedTrackWidthPct: null,
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
      plannedTrackWidthPct: null,
      overrunWidthPct: 100 - plannedMarkerPct,
      showPlannedTrack: false,
      isOverrun: true,
    }
  }

  return {
    loggedWidthPct: plannedHours > 0 ? (loggedHours / plannedHours) * 100 : 0,
    plannedMarkerPct: null,
    plannedTrackWidthPct: null,
    overrunWidthPct: 0,
    showPlannedTrack: plannedHours > 0,
    isOverrun: false,
  }
}
