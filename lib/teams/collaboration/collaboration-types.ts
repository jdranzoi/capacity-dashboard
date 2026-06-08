import type { CollaborationEdgeRelationshipMetrics } from '@/lib/teams/collaboration/collaboration-relationship-metrics'
import type { OverviewMonthOption } from '@/lib/overview/overview-month-options'

/**
 * Serializable contract for the Teams > Collaboration Network section.
 *
 * Collaboration is derived from planned co-staffing: two people share an edge when
 * both have non-PTO plan lines with `planned_hours > 0` on the same project in the
 * selected months (`fact_plans`, latest snapshot per month). This reflects intended
 * team composition, not logged time. Edge strength is shared-project count only.
 */

export type CollaborationNode = {
  id: string
  name: string
  roleKey: string
  roleLabel: string
  zoneKey: string | null
  zoneLabel: string | null
  isActive: boolean
  /** Distinct planned projects in the selected month (all categories). */
  totalProjects: number
  /** Distinct planned projects in the month matching the category filter (graph scope). */
  activeProjects: number
  /** Degree in the collaboration graph (unique collaborators). */
  collaborators: number
  /** `fact_fragmentation.flagged` for the anchor month — null when no row. */
  fragmentationFlagged: boolean | null
  /** `fact_fragmentation.total_count` for the anchor month. */
  fragmentationTotalCount: number | null
}

export type CollaborationEdge = {
  source: string
  target: string
  sharedProjects: number
  projectIds: string[]
  relationshipMetrics: CollaborationEdgeRelationshipMetrics
}

export type CollaborationProjectRef = {
  id: string
  key: string
  name: string | null
  type: string
}

export type CollaborationMatrixCell = {
  pmId: string
  tlId: string
  sharedProjects: number
}

export type CollaborationMatrixAxis = {
  id: string
  name: string
}

export type CollaborationMatrix = {
  pms: CollaborationMatrixAxis[]
  tls: CollaborationMatrixAxis[]
  cells: CollaborationMatrixCell[]
  maxValue: number
}

export type CollaborationProjectTypeCount = {
  /** Raw `dim_project.project_type`. */
  type: string
  /** Display label for KPI subline. */
  label: string
  count: number
}

export type CollaborationKpis = {
  activeCollaborators: number
  /** Distinct projects with plan assignments in the month (all categories). */
  totalProjects: number
  projectsByType: CollaborationProjectTypeCount[]
  /** Mean degree across active people (one decimal in UI). */
  avgConnections: number
  mostConnectedTl: { id: string; name: string; connections: number } | null
  collaborationDensityPct: number
  /** Recurring squad detection is a future iteration — null renders a placeholder. */
  stableSquads: number | null
}

export type CollaborationInsights = {
  strongestPmTlPair: {
    pm: CollaborationMatrixAxis
    tl: CollaborationMatrixAxis
    sharedProjects: number
  } | null
  highestFragmentation: {
    id: string
    name: string
    totalCount: number
    flagged: boolean
  } | null
  mostConnectedTl: { id: string; name: string; connections: number } | null
  isolatedResources: number
}

export type CollaborationCategoryOption = {
  value: string
  label: string
}

export type CollaborationNetworkPayload = {
  monthKey: string
  monthLabel: string
  monthOptions: OverviewMonthOption[]
  category: string
  categoryOptions: CollaborationCategoryOption[]
  personQuery: string | null
  focusPersonId: string | null
  nodes: CollaborationNode[]
  edges: CollaborationEdge[]
  /** Lookup for panels: project id → metadata. */
  projects: Record<string, CollaborationProjectRef>
  matrix: CollaborationMatrix
  kpis: CollaborationKpis
  insights: CollaborationInsights
  syncCreatedAt: string | null
}
