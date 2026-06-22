# Capacity Planning workspace — implementation plan

Progressive build-out for `/capacity/planning`. Operational staffing workspace (not BI charts). Targets **v2 tables only** (`CLAUDE.md`, D-019). Read-only Supabase via service role in server loaders after the mock-data foundation ships.

**Master track:** SP-2.4 Planning in [SP2_CAPACITY_PLAN.md](./SP2_CAPACITY_PLAN.md) — this document **supersedes the chart/horizon layout** described there for the primary route UX while reusing existing loaders where possible.

**Mock reference:** Project Planning tab — Month → Project → Role → Person tree, monthly KPI strip, right-rail staffing cards.

---

## Product intent

| Goal | Outcome |
| --- | --- |
| Operational clarity | Scan open capacity and commitments by project in a forward window |
| Staffing workflow | Surface available people and upcoming availability windows without leaving the page |
| Scalable foundation | Tree-grid + typed DTOs support future forecasting, simulations, and allocation actions |
| Calm UI | White/light-gray surfaces, sparse controls, no export/settings/group-by chrome |

**Out of scope (explicit):** export, settings, group-by toggles, global bench KPI cards, large charts, heatmaps, separate filter bars.

---

## Architecture boundaries

| Layer | Responsibility |
| --- | --- |
| **`lib/domain/workload-metrics.ts`** | Pure formulas: `plannedPct`, open hours (`net − planned`), role allocation %, fragmentation badge rules. No Supabase. |
| **`lib/capacity/planning/*`** | Loaders: period-scoped aggregates, tree DTO assembly, sidebar lists. Mock module colocated until Phase 3. |
| **`components/capacity/planning/*`** | RSC page shell + client tree-grid and sidebar cards. Formatting only — no embedded formulas. |
| **`components/capacity/_shared/*`** | Reuse header patterns, month options, Suspense shells — **not** the disabled Export header variant. |

### Import rules (SP-2 isolation)

Same as [SP2_CAPACITY_PLAN.md § Isolation model](./SP2_CAPACITY_PLAN.md#isolation-model). Planning loaders must not import from `lib/capacity/allocations/*` or other sub-section folders.

### Relationship to existing SP-2.4 code

| Existing asset | Disposition |
| --- | --- |
| `load-capacity-planning.ts` | **Reuse** — project-grain plans, role/project rollups for KPI validation |
| `load-capacity-horizon.ts` | **Reuse partially** — monthly org totals for KPI strip; retire chart/table UI |
| `capacity-planning-charts-block.tsx` | **Replace** — remove from route after tree workspace ships |
| `capacity-planning-horizon-block.tsx` | **Replace** — horizon narrative moves to “Upcoming Availability” card |
| `capacity-planning-kpi-block.tsx` | **Replace** — new per-month compact KPI strip |
| `app/(dashboard)/capacity/planning/page.tsx` | **Recreate** — deleted; wire new page shell |

---

## Mock concepts → v2 data (and gaps)

| UI concept | v2 source | Notes |
| --- | --- | --- |
| Period range (Jun → Sep 2026) | `v_dashboard_month_options` spine | URL `?from=&to=` (inclusive month keys). Default: anchor month + next 3 forward months (cap 4). |
| Monthly KPI: net capacity | `fact_capacity` per `month_date` + latest `snapshot_id` | Sum `net_capacity_hours` by month. |
| Monthly KPI: planned | `fact_plans` (`is_pto = false`) | Sum `planned_hours` by month. |
| Monthly KPI: open | Derived | `net_capacity − planned` (`roundDisplayStat`). |
| Monthly KPI: % roles ≥ 90% allocation | `fact_capacity` + `fact_plans` + stamped `role_id` | Per role: `planned / net_capacity × 100`; KPI = share of roles with value ≥ 90. |
| Tree: month → project → role → person | `fact_plans` at project grain + dims | One loader assembles nested nodes per month in range. |
| Person net / planned / open | Person-month capacity vs sum of plan lines | Person open = capacity − total planned (all projects). |
| Person utilization % | Planning context | **`plannedPct(planned, netCapacity)`** — not logged pace (that belongs on Utilization). |
| Available People list | `fact_bench` + `fact_capacity` + `fact_plans` + `dim_person` | Filter `availability_hours ≥ threshold`; project count from distinct non-PTO `project_id`. |
| Fragmentation badge | `fact_fragmentation` | Read `flagged` severity (`low` / `moderate` / `high`); map to `Healthy` \| `Moderate` \| `High` for display only. |
| Upcoming Availability rows | Month-over-month bench + plan deltas | Compare person/role availability across range; emit narrative DTOs (no chart). |
| Allocate button | — | **Phase 1:** inert / `disabled` with tooltip “Coming soon”. No write path (D-009). |
| People Planning tab (mock) | Same facts, role-first hierarchy | **Phase 2** — stub tab or hide until product signs off. |

---

## Layout slots (build order)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ SLOT-A: Page header — title + subtitle              [Period range selector] │
├──────────────────────────────────────────────────────────────────────────────┤
│ SLOT-B: Monthly KPI strip — one compact card per month in range (+ optional  │
│         fragmentation summary chip on last card if product wants it)          │
├──────────────────────────────────────────────────────────────────────────────┤
│ SLOT-C: 2-column workspace                                                    │
│   LEFT (≈8/12): Project planning tree-grid                                     │
│     · sticky header row                                                        │
│     · inline column filters (no separate filter bar)                           │
│     · sort on leaf + aggregate rows where meaningful                           │
│   RIGHT (≈4/12): stacked cards                                                 │
│     C1: Available People (in-card filters)                                   │
│     C2: Upcoming Availability (timeline rows)                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

Responsive: below `xl`, sidebar cards stack under the grid (single column).

---

## Data model (TypeScript contracts)

Add under `lib/capacity/planning/planning-types.ts` — shared by mock and live loaders.

```typescript
/** URL-facing period */
export type PlanningPeriod = {
  fromMonthKey: string // yyyy-MM
  toMonthKey: string
  monthKeys: string[] // inclusive, chronological
}

/** Shared metrics on every tree node */
export type PlanningNodeMetrics = {
  netCapacityHours: number
  plannedHours: number
  openHours: number
  utilizationPct: number | null // plannedPct
}

export type PlanningTreeNodeKind = 'month' | 'project' | 'role' | 'person'

export type PlanningTreeNode = PlanningNodeMetrics & {
  id: string
  kind: PlanningTreeNodeKind
  label: string
  /** Indent depth 0–3 */
  depth: number
  monthKey: string
  projectId?: string
  roleKey?: string
  personId?: string
  subRows?: PlanningTreeNode[]
}

export type PlanningMonthKpi = PlanningNodeMetrics & {
  monthKey: string
  monthLabel: string
  rolesAtOrAbove90Pct: number
  roleCount: number
  rolesAbove90SharePct: number | null
}

export type PlanningAvailablePerson = {
  personId: string
  personName: string
  roleLabel: string
  availableHours: number
  projectCount: number
  fragmentationLabel: 'Healthy' | 'Moderate' | 'High'
}

export type PlanningAvailabilityEvent = {
  monthKey: string
  monthLabel: string
  headline: string // e.g. "2 Frontend Developers available"
  detail?: string // e.g. "+40h Technical Lead capacity"
}

export type CapacityPlanningWorkspacePayload = {
  period: PlanningPeriod
  monthKpis: PlanningMonthKpi[]
  treeRows: PlanningTreeNode[]
  availablePeople: PlanningAvailablePerson[]
  upcomingAvailability: PlanningAvailabilityEvent[]
}
```

**Tree flattening:** Client grid uses TanStack Table `getExpandedRowModel()` with `subRows`. Loader returns nested `treeRows`; a small pure helper `flattenPlanningTree(nodes, expanded)` is optional for export/simulation consumers.

---

## Tree-grid behavior

| Concern | Approach |
| --- | --- |
| Table engine | TanStack Table v8 — `subRows`, `getExpandedRowModel`, `getFilteredRowModel`, `getSortedRowModel` |
| Columns | Name (with chevron + indent), Net Capacity, Planned, Open Capacity, Utilization % |
| Name filter | Text filter on `label` — matches project, role, or person names |
| Numeric filters | `filterNumberContains` / `filterPctContains` from `lib/table/table-filter-fns.ts` |
| Sort | `SortableHeader` on metric columns; name column sortable on `label` |
| Sticky header | `sticky top-0 z-10 bg-card` on `<thead>` inside scroll container `max-h-[…] overflow-auto` |
| Row styling | `padding-left` from `depth × 1rem`; muted type pill for `kind` (optional, subtle) |
| Pagination | **Off** for tree — expand/collapse manages density; revisit if >200 leaf rows |
| Data-table rule | Hierarchical planning grid — exempt from flat entity-table pagination rule; still requires per-column sort + filter |

**Utilization tone:** Reuse semantic text classes from `lib/capacity/shared/utilization-tone.ts` adapted for **planned** utilization bands (< 80%, 80–95%, > 95%) — planning-specific thresholds documented in the component.

---

## Component map

| File | Role |
| --- | --- |
| `app/(dashboard)/capacity/planning/page.tsx` | RSC route: parse `from`/`to`, Suspense slots |
| `components/capacity/planning/capacity-planning-workspace-page.tsx` | Async block: load payload, compose layout |
| `components/capacity/planning/capacity-planning-header.tsx` | Title, subtitle, period selector (no export) |
| `components/capacity/planning/capacity-planning-period-picker.tsx` | Client range control → URL navigation |
| `components/capacity/planning/capacity-planning-month-kpi-strip.tsx` | SLOT-B cards |
| `components/capacity/planning/capacity-planning-project-tree-grid.tsx` | Client tree-grid (`'use client'`) |
| `components/capacity/planning/capacity-planning-available-people-card.tsx` | C1 with in-card filters |
| `components/capacity/planning/capacity-planning-upcoming-availability-card.tsx` | C2 timeline list |
| `lib/capacity/planning/mock-planning-workspace.ts` | Phase 0–2 mock JSON matching `CapacityPlanningWorkspacePayload` |
| `lib/capacity/planning/load-planning-workspace.ts` | Phase 3+ live loader (replaces mock import) |
| `lib/capacity/planning/build-planning-tree.ts` | Pure nested tree builder from flat plan rows |
| `lib/capacity/planning/planning-route-period.ts` | Parse/validate/default `from`/`to` against month options |

Retire from active route (delete or keep unused until cleanup PR): `capacity-planning-charts-block.tsx`, `capacity-planning-horizon-block.tsx`, old `capacity-planning-page.tsx` orchestrator.

---

## Phased implementation

| Phase | Deliverable | Data / code |
| --- | --- | --- |
| **0** | Route shell + labeled slots (`Skeleton`) | Recreate `page.tsx`; static header copy; placeholder grid + cards |
| **1** | Mock-data workspace — full layout fidelity | `mock-planning-workspace.ts` drives all slots; period picker updates URL but can still serve mock until Phase 3 |
| **2** | Tree-grid interactions | Expand/collapse, sticky header, column sort + inline filters on mock tree |
| **3** | Live loaders — KPI strip + tree | `load-planning-workspace.ts`: parallel per-month queries (pattern from `load-capacity-horizon.ts` + project grain from `load-capacity-planning.ts`) |
| **4** | Sidebar cards — live data | Available people from `fact_bench`; upcoming events from month-over-month deltas |
| **5** | Nav ship + doc sync | Add `/capacity/planning` to `shipped-routes.ts`; update `PROJECT_STATUS.md`, SP-2.4 checklist, retire chart blocks |
| **6** | People Planning tab (optional) | Role → Person → Project hierarchy; second tab, same period context |

### Phase 3 loader sketch

1. Resolve `PlanningPeriod` from URL + `loadOverviewMonthOptions()`.
2. For each `monthKey`: resolve snapshot, fetch capacity rows, project-grain plan rows (reuse `loadProjectGrainPlans` pattern).
3. Build `PlanningMonthKpi` org rollup + role ≥ 90% stat.
4. Join `dim_project`, `dim_person`, stamped roles → `buildPlanningTree()` nested DTO.
5. For sidebar: query bench + fragmentation for selected card month (default = second month in range or `?peopleMonth=`).

Cache: `'use cache'` + `cacheLife({ stale: 120, revalidate: 300 })` per month snapshot tag — same profile as other capacity loaders.

---

## Visual system

Follow established dashboard tokens — **not** the mock’s light SaaS palette literally (app is dark-first per `CLAUDE.md`).

| Element | Token / pattern |
| --- | --- |
| Surfaces | `bg-card`, `ring-1 ring-foreground/10`, `rounded-xl` |
| KPI strip | Compact variant of `KpiMetricCard` or slimmer custom card (month title + 3 metrics + role stress %) |
| Open capacity | `text-emerald-600 dark:text-emerald-400` or existing metric token if defined |
| Grid | `dashboardTableShellClass`, hairline borders |
| Sidebar cards | Same card shell as utilization analytics panels |
| Whitespace | `gap-6` between slots; tight `text-sm` inside grid |

Invoke `/frontend-design`, `/next-best-practices`, `/next-cache-components` before Phase 0 UI work.

---

## Section boundaries

| This page | Elsewhere |
| --- | --- |
| Forward **planned** commitments by project | **Utilization** — logged/billable operational usage |
| Available people snapshot | **Bench** — org-level bench analytics |
| Person fragmentation badge (read-only) | **People → Fragmentation** — deep analysis |
| Allocate CTA (future) | No write path in dashboard |

---

## Progress tracker

| ID | Item | Status |
| --- | --- | --- |
| P0 | Route shell + layout slots | **Done** |
| P1 | Mock payload + static workspace render | **Done** |
| P2 | Tree-grid: expand, sort, filter, sticky header | **Done** |
| P3 | Live loader: period KPIs + both trees | **Done** |
| P4 | Live sidebar: Available People + Upcoming Availability | **Done** |
| P5 | Ship nav + retire chart/horizon blocks + doc sync | **Done** |

**Default next step:** **P0** — recreate `app/(dashboard)/capacity/planning/page.tsx` with SLOT-A/B/C scaffolding.

---

## References

- [SP2_CAPACITY_PLAN.md § SP-2.4](./SP2_CAPACITY_PLAN.md#sp-24--planning-capacityplanning) — track ownership
- [TEAM_DASHBOARD_PLAN.md](./TEAM_DASHBOARD_PLAN.md) — phased plan pattern
- [NAVIGATION_FUNCTIONAL.md § Capacity — Planning](./NAVIGATION_FUNCTIONAL.md#capacity)
- `components/capacity/utilization/utilization-staffing-grid.tsx` — column filter/sort reference
- `lib/capacity/planning/load-capacity-planning.ts` — project-grain plans
- `lib/capacity/planning/load-capacity-horizon.ts` — multi-month aggregates
- `.cursor/rules/data-tables.mdc` — sort/filter primitives

---

*Last updated: planning workspace UX plan — supersedes chart-first SP-2.4 layout for `/capacity/planning`.*
