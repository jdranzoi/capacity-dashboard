# SP-2 Capacity — implementation plan

> **Subplan:** SP-2 · **Question:** Can we absorb work?  
> **Master plan:** [PLAN_MASTER.md § SP-2](./PLAN_MASTER.md#sp-2--capacity) · **IA spec:** [NAVIGATION_FUNCTIONAL.md § Capacity](./NAVIGATION_FUNCTIONAL.md#capacity)  
> **Status checkpoint:** [PROJECT_STATUS.md](./PROJECT_STATUS.md)

Progressive build-out for `/capacity/*`. Targets **v2 tables only** (`CLAUDE.md`, D-019). Read-only Supabase via service role in server loaders.

**SP-1 (Overview extension) is deferred.** Widgets built here should expose props-only interfaces so Overview can import them later without route coupling.

---

## Isolation model

Each Level 2 sub-section is an **independent track**: own route, loader, components, and progress checklist. Changes in one track must not require edits in another.

```
┌─────────────────────────────────────────────────────────────────┐
│  SHARED FOUNDATION (SP-2.0) — stable, minimal, read-only API     │
│  lib/capacity/shared/* · components/capacity/_shared/*           │
└────────────────────────────┬────────────────────────────────────┘
                             │ imports only ↓
     ┌──────────┬────────────┼────────────┬──────────┬──────────┐
     ▼          ▼            ▼            ▼          ▼          ▼
 Overview  Operations   Planning   Allocations   Bench   Forecast/Scenarios
 SP-2.2    SP-2.3       SP-2.4     SP-2.5        SP-2.6    SP-2.7
```

### Import rules (non-negotiable)

| Layer | May import from | Must NOT import from |
| --- | --- | --- |
| Sub-section page (`app/.../capacity/{x}/page.tsx`) | Its own loader + `_shared` + `lib/domain` + existing public loaders (`lib/overview`, `lib/team`) | Other sub-section loaders or `components/capacity/{other}/` |
| Sub-section loader (`lib/capacity/{x}/load-*.ts`) | `lib/capacity/shared/*`, `lib/data/*`, `lib/domain/*`, `lib/overview/*`, `lib/team/*` (read-only reuse) | Other sub-section loader folders |
| Sub-section UI (`components/capacity/{x}/*`) | `_shared`, `components/ui`, `components/dashboard`, overview chart primitives | Other sub-section component folders |
| `lib/domain/workload-metrics.ts` | Pure math only | Supabase, React, sub-section loaders |

### File ownership matrix

| Track | Route | Loader(s) | Components |
| --- | --- | --- | --- |
| **SP-2.0 Foundation** | — | `lib/capacity/shared/*` | `components/capacity/_shared/*` |
| **SP-2.2 Overview** | `/capacity/overview` | `lib/capacity/overview/*` | `components/capacity/overview/*` |
| **SP-2.3 Operations** | `/capacity/operations` | `lib/capacity/operations/*` | `components/capacity/operations/*` |
| **SP-2.4 Planning** | `/capacity/planning` | `lib/capacity/planning/*` | `components/capacity/planning/*` |
| **SP-2.5 Allocations** | `/capacity/allocations` | `lib/capacity/allocations/*` | `components/capacity/allocations/*` |
| **SP-2.6 Bench** | `/capacity/bench` | `lib/capacity/bench/*` | `components/capacity/bench/*` |
| **SP-2.7 Forecast** | `/capacity/forecast` | `lib/capacity/forecast/*` | `components/capacity/forecast/*` |
| **SP-2.7 Scenarios** | `/capacity/scenarios` | — (stub) | `components/capacity/_shared/capacity-coming-soon.tsx` |

When a sub-section ships, update **only** its checklist row in [Progress tracker](#progress-tracker), add its `href` to [`lib/navigation/shipped-routes.ts`](../lib/navigation/shipped-routes.ts), and the summary line in [PROJECT_STATUS.md](./PROJECT_STATUS.md).

---

## Architecture boundaries

| Layer | Responsibility |
| --- | --- |
| **`lib/domain/*.ts`** | Pure KPI formulas. Extend here for Capacity-specific metrics (planned util, bench rate, allocation %, saturation). No Supabase. |
| **`lib/capacity/shared/*`** | Month context (snapshot + filters), route filter parsing, cache tags, shared DTO types. No sub-section-specific queries. |
| **`lib/capacity/{subsection}/*`** | One folder per sub-section. Supabase reads scoped to that page's question. |
| **`components/capacity/{subsection}/*`** | RSC-first UI for that route only. Formatting and layout; no embedded formulas. |
| **`components/capacity/_shared/*`** | Header, toolbar shell, skeletons, coming-soon — no business logic tied to a single sub-section metric. |

Charts consume DTOs from the sub-section loader via domain helpers (`roundDisplayStat`, `fmtHoursKpi`, `fmtPct`).

**Data tables:** Entity lists must use TanStack Table with per-column sort and filter (`.cursor/rules/data-tables.mdc`, `components/ui/data-table/interactive-data-table.tsx`).

---

## Shared foundation (SP-2.0)

Build once before sub-section tracks. Treat as a **frozen contract** — extend shared types additively; avoid breaking sub-section imports.

### Deliverables

| File | Purpose |
| --- | --- |
| `lib/capacity/shared/capacity-route-filters.ts` | Parse `?month=&role=&zone=&project=&projectType=` |
| `lib/capacity/shared/load-capacity-month-context.ts` | Resolve month, snapshot, filter scope |
| `lib/capacity/shared/capacity-page-cache.ts` | `cacheLife` profile for capacity loaders |
| `components/capacity/_shared/capacity-route-section.tsx` | Suspense boundary |
| `components/capacity/_shared/capacity-route-pending-shell.tsx` | Pending shell |
| `components/capacity/_shared/capacity-section-skeletons.tsx` | Loading skeletons |
| `components/capacity/_shared/capacity-header-block.tsx` | Title + sync freshness |
| `components/capacity/_shared/capacity-toolbar-block.tsx` | Month picker (+ filter slots per page) |
| `components/capacity/_shared/capacity-coming-soon.tsx` | Forecast / Scenarios stub |

### Reuse from existing code (read-only)

| Existing | Use |
| --- | --- |
| `loadOverviewMonthOptions` | Month picker options |
| `getLatestSyncSnapshot` | Snapshot anchor |
| `resolveFilteredPersonIds` (`lib/team`) | Filter scope |
| `KpiMetricCard` (`components/dashboard`) | KPI rows |
| `fmtHoursKpi`, `fmtPct` (`lib/overview/overview-metrics.ts`) | Display |

### SP-2.0 checklist

- [x] **SP-2.0.1** Shared route filters + month context loader
- [x] **SP-2.0.2** `_shared` layout components (header, toolbar, skeletons, Suspense shell)
- [x] **SP-2.0.3** Document import rules in this file (done — keep updated)

---

## Domain metrics (shared formulas)

Add to `lib/domain/workload-metrics.ts` as needed. Display at UI boundary via `roundDisplayStat`.

| Metric | Formula | Primary tracks |
| --- | --- | --- |
| Capacity fill | `logged_mtd / net_capacity × 100` (`capacityFillPct`) | Overview, Operations |
| Utilization | mean per-person `logged / (elapsed net weekdays × 8h)` | Overview, Operations |
| Planned | `planned / net_capacity × 100` (`plannedPct`) | Overview, Planning |
| Bench rate (hours) | `sum(availability_hours) / sum(net_capacity) × 100` | Overview, Bench |
| Bench headcount | `count(is_bench = true)` | Bench |
| Allocation % | `planned_hours_on_project / net_capacity × 100` | Allocations |
| Operational saturation | `max(planned, logged_mtd) / net_capacity × 100` | Operations |
| Plan vs actual gap | `planned − logged_mtd` (hours) | Operations, Planning |
| Productivity | `loggedVersusPlannedProductivityPct` | Operations |
| Efficiency | `billableVersusLoggedEfficiencyPct` | Operations |
| Split allocation | person with ≥2 non-PTO projects in `fact_plans` | Allocations |

**Not C-005:** Formal billable utilization stays in `lib/domain/utilization.ts`. Capacity surfaces use **logged vs capacity** unless explicitly labeled otherwise.

---

## Data inventory (MCP → Supabase v2)

All Phase 1 sub-sections consume existing v2 ingestion. No new sync work required.

| Table | SP-2 use |
| --- | --- |
| `sync_snapshot` | Latest snapshot per month |
| `fact_capacity` | Roster, net capacity |
| `fact_plans` | Planned hours (person + project grain for Planning/Allocations) |
| `fact_worklogs` | Logged/billable MTD (overview date cap) |
| `fact_bench` | Pre-computed bench (`availability_hours`, `is_bench`) |
| `dim_person`, `dim_role`, `dim_zone`, `dim_project` | Labels, filters, grouping |
| `dim_holiday` | Elapsed pace (reuse overview/team helpers) |
| `v_dashboard_month_options` | Month spine |

**Note:** `lib/data/load-month-fact-bundle.ts` aggregates plans **by person** (no `project_id`). Planning and Allocations need dedicated loaders at project grain — do not extend the bundle in ways that affect Overview/Team consumers.

---

## Sub-section tracks

### SP-2.2 — Overview (`/capacity/overview`)

**Question:** What is our capacity position this month?

#### Metrics

| KPI | Source |
| --- | --- |
| Net capacity | `orgMonthRollupHours.netCapacityHours` |
| Planned | `orgMonthRollupHours.plannedHours` |
| Logged (MTD) | `orgMonthRollupHours.loggedHoursMtd` |
| Bench hours | `sum(fact_bench.availability_hours)` |
| Capacity fill | `capacityFillPct` |
| Utilization | `loadWeeklyOverview.utilizationPct` |
| Planned | `plannedPct` |

#### Charts

| Chart | Type | Reuse |
| --- | --- | --- |
| Weekly evolution | Grouped bar + logged line | `WeeklyEvolutionChart` |
| Capacity composition | Donut | Overview capacity-share pattern |
| Role summary | Compact table (top roles) | Adapt role table from team analytics |

#### Loader

`lib/capacity/overview/load-capacity-overview.ts` — thin wrapper: `loadWeeklyOverview` + bench summary DTO.

#### Components

`components/capacity/overview/capacity-overview-page.tsx`, `capacity-overview-kpi-block.tsx`, `capacity-overview-charts-block.tsx`

#### Checklist

- [x] **SP-2.2.1** Loader + DTO types
- [x] **SP-2.2.2** KPI row
- [x] **SP-2.2.3** Weekly evolution + composition charts
- [x] **SP-2.2.4** Role summary table
- [x] **SP-2.2.5** Wire route `app/(dashboard)/capacity/overview/page.tsx`

---

### SP-2.3 — Operations (`/capacity/operations`)

**Question:** How is capacity being consumed right now?

#### Metrics

Logged, billable, PTO, efficiency, operational saturation — org and by role.

#### Charts / tables

| Surface | Type |
| --- | --- |
| Utilization by role | Table + mini bars (extend team pattern) |
| Capacity stack by role | Stacked bar: net / planned / logged / bench |
| Commercial vs internal | Grouped bar (project_type split) |
| Weekly evolution | Filtered scope |

#### Loader

`lib/capacity/operations/load-capacity-operations.ts` — extends role analytics with `billableHoursMtd`, `ptoHoursMtd`, `saturationPct` per role. Reuse `getMonthFactBundle`, `loadTeamRoleAnalytics` patterns without importing the team loader directly if diverging fields would create coupling; copy aggregation logic into operations folder if needed.

#### Filters

`capacity-route-filters`: month, role, zone, project, project_type.

#### Components

`components/capacity/operations/capacity-operations-kpi-block.tsx`, `capacity-operations-role-table.tsx`, `capacity-operations-charts-block.tsx`

#### Checklist

- [ ] **SP-2.3.1** Operations loader (role + org rollups)
- [ ] **SP-2.3.2** Filtered toolbar
- [ ] **SP-2.3.3** KPI row (saturation, efficiency, PTO)
- [ ] **SP-2.3.4** Role breakdown table + stacked bar
- [ ] **SP-2.3.5** Wire route

---

### SP-2.4 — Planning (`/capacity/planning`)

**Question:** Where is capacity committed (now and ahead)?

#### Metrics

Total planned hours, planned utilization %, roles staffed, projects with plans, plan vs logged gap (when month is current).

#### Charts / tables

| Surface | Type |
| --- | --- |
| Planned by role | Horizontal bar |
| Planned by project | Bar (top N, color by `project_type`) |
| Plan timeline | Multi-month bar (optional v2 — current + next 2 months) |

#### Loader

`lib/capacity/planning/load-capacity-planning.ts` — `fact_plans` at **project grain** joined to `dim_person`, `dim_project`, `dim_role`; denominator from `fact_capacity`.

#### Open product decisions

- [ ] Planning horizon: single month vs current + next 2 months (default TBD)
- [ ] Planned util. denominator: `net_capacity_hours` vs net minus PTO

#### Components

`components/capacity/planning/capacity-planning-kpi-block.tsx`, `capacity-planning-role-chart.tsx`, `capacity-planning-project-chart.tsx`

#### Checklist

- [ ] **SP-2.4.1** Project-grain plan loader
- [ ] **SP-2.4.2** KPI row
- [ ] **SP-2.4.3** Role + project charts
- [ ] **SP-2.4.4** Wire route

---

### SP-2.5 — Allocations (`/capacity/allocations`)

**Question:** Who is assigned where, and at what intensity?

#### Metrics

People with split allocations, average allocation %, projects staffed, unallocated people.

#### Grid (TanStack Table, long format)

Columns: Person · Role · Project · Planned h · Alloc % · Logged MTD · Plan vs logged gap · Split flag

Optional toggle: pivot view (person × project) for small scopes.

#### Loader

`lib/capacity/allocations/load-capacity-allocations.ts` — joins `fact_plans`, `fact_capacity`, worklogs MTD, dims.

#### Row DTO

```typescript
type CapacityAllocationRow = {
  personId: string
  personName: string
  roleLabel: string
  projectId: string
  projectKey: string
  projectType: string
  plannedHours: number
  allocationPct: number | null
  loggedHoursMtd: number
  planVsLoggedGapHours: number
  isSplitAllocation: boolean
}
```

#### Components

`components/capacity/allocations/capacity-allocation-grid.tsx`, `capacity-allocations-kpi-block.tsx`

#### Checklist

- [ ] **SP-2.5.1** Allocation loader + DTO
- [ ] **SP-2.5.2** KPI row
- [ ] **SP-2.5.3** TanStack grid (sort, pagination)
- [ ] **SP-2.5.4** Wire route

---

### SP-2.6 — Bench (`/capacity/bench`)

**Question:** Where is open capacity we can staff?

#### Metrics

Bench headcount, bench hours, bench rate %, average availability per person.

#### Charts / tables

| Surface | Type |
| --- | --- |
| Bench by role | Bar (`availability_hours`) |
| Person table | Sortable: Person · Role · Net cap · Planned · Available h · Avail % · `is_bench` |
| Staffing opportunities | Filter: `availability_hours` ≥ threshold (TBD, e.g. 32h) |

#### Loader

`lib/capacity/bench/load-capacity-bench.ts` — reads `fact_bench` + dims. Uses pre-computed `availability_hours` and `is_bench` from ingestion.

#### Open product decisions

- [ ] Bench opportunity threshold (hours/month)

#### Components

`components/capacity/bench/capacity-bench-kpi-block.tsx`, `capacity-bench-role-chart.tsx`, `capacity-bench-table.tsx`

#### Checklist

- [ ] **SP-2.6.1** Bench loader
- [ ] **SP-2.6.2** KPI row
- [ ] **SP-2.6.3** Role chart + person table
- [ ] **SP-2.6.4** Wire route

---

### SP-2.7 — Forecast & Scenarios

**Forecast** (`/capacity/forecast`): coming-soon shell in Phase 1. Optional **lite trends** (not predictive): 6-month series of net capacity, planned, logged, bench from historical months via `v_dashboard_month_options`.

**Scenarios** (`/capacity/scenarios`): stub only — no simulation engine in v2.

#### Forecast loader (optional Phase 1b)

`lib/capacity/forecast/load-capacity-trend-series.ts` — multi-month aggregates; each month resolves its own snapshot.

#### Checklist

- [x] **SP-2.7.1** Forecast coming-soon page
- [x] **SP-2.7.2** Scenarios coming-soon page
- [ ] **SP-2.7.3** *(optional)* 6-month trend charts

---

## Recommended build order

Tracks can pause independently after each checklist block ships.

```
SP-2.0  Foundation (shared shell)
  → SP-2.2  Overview      (validates shell; highest reuse)
  → SP-2.6  Bench         (fact_bench; high value, low coupling)
  → SP-2.3  Operations    (role breakdown + saturation)
  → SP-2.4  Planning      (new project-grain loader)
  → SP-2.5  Allocations   (TanStack grid)
  → SP-2.7  Forecast/Scenarios stubs (+ optional trends)
```

---

## Progress tracker

Update the row for the track you ship. Do not mark other tracks.

| Track | ID | Item | Status |
| --- | --- | --- | --- |
| Foundation | SP-2.0 | Shared filters, month context, `_shared` UI | **Done** |
| Overview | SP-2.2 | `/capacity/overview` — KPIs, charts, role summary | **Done** |
| Operations | SP-2.3 | `/capacity/operations` — role breakdown, saturation | Not started |
| Planning | SP-2.4 | `/capacity/planning` — project-grain plans | Not started |
| Allocations | SP-2.5 | `/capacity/allocations` — allocation grid | Not started |
| Bench | SP-2.6 | `/capacity/bench` — bench table + role chart | Not started |
| Forecast | SP-2.7 | `/capacity/forecast` — stub (+ optional trends) | Stub done |
| Scenarios | SP-2.7 | `/capacity/scenarios` — stub | Stub done |

**Route shells:** SP-0 created placeholder pages under `app/(dashboard)/capacity/*`. Each track replaces its placeholder when its checklist is complete.

---

## Section boundaries (avoid overlap)

| Capacity track | Teams / People / Overview |
| --- | --- |
| **Overview** | Org capacity *position* — not executive health score (SP-1) |
| **Operations** | Saturation, PTO, efficiency — not team composition (Teams) |
| **Planning** | Forward *commitments* — not individual overload (People) |
| **Allocations** | Person×project *mapping* — not fragmentation flags (People) |
| **Bench** | Org-level slack pool — not per-person availability calendar (People → Availability) |

---

## SP-1 deferral — reuse candidates

When SP-1 resumes, import from Capacity sub-section components (props-only):

| Widget | Source track |
| --- | --- |
| Bench rate KPI | SP-2.6 Bench |
| Capacity composition donut | SP-2.2 Overview |
| Role saturation snippet | SP-2.3 Operations |
| Plan vs actual gap | SP-2.4 Planning |

---

## References

- [PLAN_MASTER.md](./PLAN_MASTER.md) — subplan index
- [NAVIGATION_FUNCTIONAL.md](./NAVIGATION_FUNCTIONAL.md) — Level 2 IA
- [TEAM_DASHBOARD_PLAN.md](./TEAM_DASHBOARD_PLAN.md) — parallel pattern for `/teams`
- `CLAUDE.md` — v2 tables, snapshot pattern, overview weekly metrics contract
- `lib/domain/workload-metrics.ts`, `lib/domain/utilization.ts` — formulas
- `lib/overview/load-weekly-overview.ts` — org rollup patterns

---

*Last updated: SP-2.0 Foundation + SP-2.2 Overview shipped; next = SP-2.6 Bench.*
