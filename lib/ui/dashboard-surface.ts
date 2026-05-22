import { cn } from '@/lib/utils'

/**
 * Shared dashboard panel surfaces — card on page background.
 * Use across analytics sections, data tables, and KPI blocks for visual consistency.
 */
export const DASHBOARD_SURFACE =
  'rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10'

export const DASHBOARD_SURFACE_PADDING = 'p-4'

/** Standard analytics / chart panel with default padding. */
export function dashboardSurfaceClass(className?: string): string {
  return cn(DASHBOARD_SURFACE, DASHBOARD_SURFACE_PADDING, className)
}

/** Outer shell for interactive data tables (padding handled by inner table regions). */
export function dashboardTableShellClass(className?: string): string {
  return cn(DASHBOARD_SURFACE, className)
}

/** Empty-state block inside a table shell. */
export function dashboardTableEmptyClass(className?: string): string {
  return cn(DASHBOARD_SURFACE, DASHBOARD_SURFACE_PADDING, className)
}
