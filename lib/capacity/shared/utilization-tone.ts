import type { CSSProperties } from 'react'

function segmentMix(
  u: number,
  lo: number,
  hi: number,
  lowColor: string,
  highColor: string
): string {
  if (hi <= lo) return highColor
  const t = Math.min(1, Math.max(0, (u - lo) / (hi - lo))) * 100
  return `color-mix(in oklch, ${lowColor} ${100 - t}%, ${highColor} ${t}%)`
}

/**
 * Solid fill for logged-vs-net-capacity utilization (team role bars, staffing Util tint).
 * Anchored CSS tokens (`--team-util-tone-*` in `app/globals.css`):
 * saturated blue (floor through ~15%), cyan bridge (mid-low), green (~target band), amber/red, violet (>100%).
 */
export function utilizationLoggedVsCapacityFill(utilPct: number): string {
  const blue = 'var(--team-util-tone-blue)'
  const cyan = 'var(--team-util-tone-cyan)'
  const green = 'var(--team-util-tone-green)'
  const amber = 'var(--team-util-tone-amber)'
  const red = 'var(--team-util-tone-red)'
  const over = 'var(--team-util-tone-over)'

  if (utilPct > 100) {
    const w = Math.min(Math.max((utilPct - 100) / 45, 0), 1) * 100
    return `color-mix(in oklch, ${red} ${100 - w}%, ${over} ${w}%)`
  }
  if (utilPct <= 0) return blue

  /* Plateau keeps very low % clearly blue vs mid-low cyan/green (was washed together when diluted). */
  if (utilPct <= 15) return blue
  if (utilPct <= 42) return segmentMix(utilPct, 15, 42, blue, cyan)
  if (utilPct <= 58) return segmentMix(utilPct, 42, 58, cyan, green)
  if (utilPct <= 74) return segmentMix(utilPct, 58, 74, green, amber)
  if (utilPct <= 88) return segmentMix(utilPct, 74, 88, amber, red)
  return red
}

/** Mini-track fill + width (width capped at 100%; tone uses raw % including >100). */
export function utilizationLoggedVsCapacityBarStyles(
  utilizationPct: number | null
): CSSProperties {
  if (utilizationPct == null || Number.isNaN(utilizationPct)) {
    return { width: '0%', backgroundColor: 'transparent' }
  }
  const widthPct = Math.min(100, Math.max(0, utilizationPct))
  return {
    width: `${widthPct}%`,
    backgroundColor: utilizationLoggedVsCapacityFill(utilizationPct),
  }
}

/** Subtle cell background for staffing Util column (same hue progression). */
export function utilizationLoggedVsCapacityCellStyle(
  utilizationPct: number | null
): CSSProperties {
  if (utilizationPct == null || Number.isNaN(utilizationPct)) return {}
  const fill = utilizationLoggedVsCapacityFill(utilizationPct)
  return {
    backgroundColor: `color-mix(in oklch, ${fill} 42%, var(--background))`,
  }
}
