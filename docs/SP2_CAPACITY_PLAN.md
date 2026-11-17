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
| Sub-section UI (`components/capacity/{x}/*`) | `_shared`, `components/ui`, overview chart primitives | Other sub-section component folders |
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
| `components/capacity/_shared/capacity-route-pending-shell.tsx` | Route pending shell + `CapacityRouteSection` |
| `components/capacity/_shared/capacity-route-pending-shell.tsx` | Pending shell |
| `components/capacity/_shared/capacity-section-skeletons.tsx` | Loading skeletons |
| `components/capacity/_shared/capacity-header-block.tsx` | Title + sync freshness |
| `components/capacity/_shared/capacity-toolbar-block.tsx` | Month picker (+ filter slots per page) |
| `components/capacity/_shared/capacity-coming-soon.tsx` | Forecast / Scenarios stub |
| `components/capacity/_shared/capacity-ops-kpi-columns.tsx` | Three-column ops KPI grid (Utilization) |
| `components/capacity/_shared/role-analytics-table.tsx` | Role table with people sub-rows (Overview month to date, Utilization) |
| `lib/capacity/shared/load-planning-month-options.ts` | Planning period options (Planning picker, Overview Planned links) |
| `lib/capacity/shared/sum-logged-hours-by-commercial.ts` | Commercial vs non-commercial logged hours (`is_commercial`) |

### Reuse from existing code (read-only)

| Existing | Use |
| --- | --- |
| `loadOverviewMonthOptions` | Month picker options |
| `getLatestSyncSnapshot` | Snapshot anchor |
| `resolveFilteredPersonIds` (`lib/team`) | Filter scope |
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
| Capacity fill | `logged_mtd / net_capacity × 100` (`capacityFillPct`) | Overview, Utilization |
| Utilization | `sum(logged) / sum(elapsed net weekdays × 8h)`, ratio of sums (D-032, `loggedUtilizationPct`) | Overview, Utilization |
| Elapsed capacity | `sum(elapsed net weekdays × 8h)` | Overview, Utilization |
| Commercial utilization | `commercial_logged_mtd / elapsed_capacity × 100` (`commercialUtilizationPct`) | Overview, Utilization |
| Planned (Planned utilization on the Overview matrix) | `planned / net_capacity × 100` (`plannedPct`) | Overview, Utilization, Planning |
| Bench rate (hours) | `sum(availability_hours) / sum(net_capacity) × 100` | Bench |
| Bench headcount | `count(is_bench = true)` | Bench |
| Allocation % | `planned_hours_on_project / net_capacity × 100` | Allocations |
| Operational saturation | `max(planned, logged_mtd) / net_capacity × 100` | Operations |
| Plan vs actual gap | `planned − logged_mtd` (hours) | Operations, Planning |
| Productivity | `loggedVersusPlannedProductivityPct` | Operations |
| Efficiency | `billableVersusLoggedEfficiencyPct` | Operations (staffing grid Eff. column still uses this) |
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
| `fact_month_ops` | Overview YoY cards (person-month hours + elapsed days) |

**Note:** `lib/data/load-month-fact-bundle.ts` aggregates plans **by person** (no `project_id`). Planning and Allocations need dedicated loaders at project grain — do not extend the bundle in ways that affect Overview/Team consumers.

---

## Sub-section tracks

### SP-2.2 — Overview (`/capacity/overview`)

**Question:** What is our capacity position across the year, this month, and against prior years?

Page order (org-wide, no toolbar or filters): **Monthly breakdown** matrix → **Month to date** section → same-period **Year** cards. No `fact_bench` on this page; bench belongs on SP-2.6.

#### Monthly breakdown

Month x KPI matrix with a tab per year (most recent first; the current year is the default tab). Columns: Jan–Dec, Q1–Q4, year, with vertical hairlines before each quarter of months, before the quarter totals and before the year. Columns have fixed widths so switching years does not move the table.

| Row | Month value | Quarter / year |
| --- | --- | --- |
| Headcount | `fact_month_ops` rows of the month (capacity population, D-034) | Average of the months with data |
| Net capacity | Sum of `net_capacity_hours` | Sum |
| Planned hours | Sum of `planned_hours` (delivery plans of the month's canonical snapshot, D-029) | Sum |
| PTO (divider above) | Sum of `pto_hours` | Sum |
| Logged / Commercial / Non-commercial hours | Sums of the person-month hours | Sum |
| Planned utilization (divider above) | `planned / net capacity` (`plannedPct`, `PLANNED_UTILIZATION_KPI`) | Ratio of summed hours |
| Utilization | `logged / elapsed capacity` (`loggedUtilizationPct`) | Ratio of summed hours (D-032) |
| Commercial utilization | `commercial / elapsed capacity` (`commercialUtilizationPct`) | Ratio of summed hours |

The month in progress is marked **MTD**. Months after it are **plan months** (marked **Plan**; quarters and years that include one are marked **incl. plan**), through December of the next year. The next year gets its own tab as soon as the latest snapshot plans into it.

**Plan months** (`lib/capacity/overview/load-capacity-plan-months.ts`): months not in `fact_month_ops` yet, read from the latest `sync_snapshot`. `fact_capacity` gives the month's population (headcount), net capacity, planned PTO (D-030) and month role; `fact_plans` with `DELIVERY_PLAN_FILTER` gives planned hours, limited to that population. They fill Headcount, Net capacity, Planned hours, PTO and Planned utilization; logged-side rows stay empty. In quarters and years, capacity-side rows include plan months and logged-side rows cover synced months only. Plan months reach as far as the sync horizon (`sync-v2.ts`: furthest active build end date, 4 months by default, 12 at most); the matrix notes the last plan month when it stops before December. Plans for distant months are usually incomplete, so planned utilization drops with distance.

**Expandable rows** (same aggregation rules per child row):

| Rows | Breakdown | Source |
| --- | --- | --- |
| Headcount, Net capacity, Planned hours, Logged hours, Planned utilization, Utilization, Commercial utilization | By role (month role) | `fact_month_ops.role_id` (plan months: `fact_capacity.role_id`) → `dim_role.label`; children sum to the parent for headcount and hours |
| Commercial hours, Non-commercial hours | By project type | `fact_month_projects.population_commercial_hours` / `population_non_commercial_hours` (capacity population only, capacity-mcp migration 033) grouped by the current `dim_project.project_type`; labels and order from `dim_project_type`. Children sum to the parent. A Jira category change regroups history at the next sync without a rebuild, unless it changes `is_commercial` |

**Month links** (open in a new tab, only for months the target page's picker offers; other cells stay plain):

| Row | Target | Months with a link |
| --- | --- | --- |
| Headcount | `/teams/overview?month=YYYY-MM` | `TEAMS_MONTH_HORIZON` (8 months back, 3 forward) with `fact_capacity` data |
| Planned hours | `/capacity/planning?from=YYYY-MM` | Current month onward with plans and capacity in the same snapshot (`lib/capacity/shared/load-planning-month-options.ts`) |
| Utilization | `/capacity/utilization?month=YYYY-MM` | Months in `fact_capacity` through the current month |

**Export** dropdown (`components/ui/dropdown-menu.tsx`) over the visible rows, expanded children included: Copy as Markdown (display format), Copy as JSON, Copy as CSV, Copy for Google Sheets (HTML table + tab-separated text; pastes as cells in Sheets and Excel) and Download CSV. Spreadsheet formats use whole numbers with the unit in the row label. Shift+Cmd+M / J / C / G / D run them while the menu is open.

#### Month to date

**Month to date · <month>**: weekly evolution chart and role summary for the month in progress. The role summary (`RoleAnalyticsTable`, shared with Utilization) lists capacity fill, utilization and planned share per role; each role expands to its people (TanStack sub-rows; the Role filter also matches people).

#### Year

Nine cards (3 per row) — Net capacity / Headcount / Projects; Logged / Commercial hours / Non-commercial hours; Utilization / Commercial utilization / PTO. Hours and % cards are same-period YTD vs prior years plus a monthly line series per year. Headcount adds YoY unique-people lines plus current-year role stacks. Projects table and solid YoY lines are unique **commercial** projects (`dim_project.is_commercial`, same flag as commercial hours). Dotted YoY lines are **NC** (non-commercial) project counts, one series per year in that year's compare color. A two-layer stack (commercial vs other) shows the current-year mix. Line dots and stacked-bar segments open `/projects/activity` in a new tab for that month.

#### Loaders

- `lib/capacity/overview/load-capacity-year.ts` — monthly breakdown (`build-capacity-year-grid.ts`) and Year cards (`build-capacity-year.ts`) from `fact_month_ops` / `fact_month_projects` (D-026), plus plan months (`load-capacity-plan-months.ts`). Month buckets shared via `month-ops-buckets.ts`; export formats in `capacity-year-grid-export.ts`.
- `lib/capacity/overview/load-capacity-overview.ts` — month to date: weekly evolution (`loadWeeklyOverview`) and role summary with people (`loadRoleAnalytics`).

#### Components

`components/capacity/overview/`: `capacity-overview-block.tsx` (page order, month link options), `capacity-year-grid.tsx` (monthly breakdown), `capacity-overview-charts-section.tsx` (month to date), `capacity-overview-role-summary.tsx`, `capacity-year-section.tsx` (Year cards).

#### Checklist

- [x] **SP-2.2.1** Loader + DTO types
- [x] **SP-2.2.2** KPI row (replaced by the monthly breakdown in SP-2.2.7)
- [x] **SP-2.2.3** Weekly evolution chart
- [x] **SP-2.2.4** Role summary table
- [x] **SP-2.2.5** Wire route `app/(dashboard)/capacity/overview/page.tsx`
- [x] **SP-2.2.6** Same-period YoY cards from `fact_month_ops`
- [x] **SP-2.2.7** Monthly breakdown matrix (months, quarters, year; year tabs) replaces the current-month strip
- [x] **SP-2.2.8** Expandable rows (by role, by project type), quarter separators, Export dropdown
- [x] **SP-2.2.9** Plan months up to the sync horizon, next-year tab, Planned hours and Planned utilization rows
- [x] **SP-2.2.10** Month to date section under the matrix; role summary expands to people
- [x] **SP-2.2.11** Month links (Teams overview, Planning, Utilization)

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

### SP-2.4 — Planning & Horizon (`/capacity/planning`)

**Question:** Where is capacity committed (now and ahead)?

**SP-2.7 (Forecast) merged into this track.** `/capacity/forecast` redirects here.

#### Metrics

Net capacity, planned hours, planned utilization %, projects with plans, unallocated capacity gap.

#### Charts / tables

| Surface | Type |
| --- | --- |
| Planned by role | Horizontal bar (net capacity track + planned bar) |
| Planned by project | Bar (top 10, color by `project_type`) |
| Capacity horizon | Multi-month grouped bar (net cap + planned, last 6 months) |
| Monthly breakdown | Table: month · net cap · planned · coverage % · gap · bench |

#### Loaders

- `lib/capacity/planning/load-capacity-planning.ts` — `fact_plans` at project grain joined to `dim_project`, `dim_role`, `fact_capacity`.
- `lib/capacity/planning/load-capacity-horizon.ts` — last 6 months from `v_dashboard_month_options`, parallel aggregate queries per month.

#### Components

`components/capacity/planning/capacity-planning-kpi-block.tsx`, `capacity-planning-charts-block.tsx` (role + project charts), `capacity-planning-horizon-block.tsx` (timeline + table), `capacity-planning-page.tsx`

#### Checklist

- [x] **SP-2.4.1** Project-grain plan loader
- [x] **SP-2.4.2** Multi-month horizon loader
- [x] **SP-2.4.3** KPI row
- [x] **SP-2.4.4** Role + project charts
- [x] **SP-2.4.5** Horizon timeline chart + monthly breakdown table
- [x] **SP-2.4.6** Wire route; `/capacity/forecast` → redirect

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

### SP-2.7 — Scenarios

**Forecast merged into SP-2.4 Planning.** `/capacity/forecast` redirects to `/capacity/planning`.

**Scenarios** (`/capacity/scenarios`): stub only — no simulation engine in v2.

#### Checklist

- [x] **SP-2.7.2** Scenarios coming-soon page

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
| Overview | SP-2.2 | `/capacity/overview` — monthly breakdown matrix, YoY cards, charts, role summary | **Done** |
| Operations | SP-2.3 | `/capacity/operations` — role breakdown, saturation | Not started |
| Planning & Horizon | SP-2.4 | `/capacity/planning` — project-grain plans + multi-month horizon | **Done** |
| Allocations | SP-2.5 | `/capacity/allocations` — allocation grid | Not started |
| Bench | SP-2.6 | `/capacity/bench` — bench table + role chart | Not started |
| Forecast | SP-2.7 | Merged into SP-2.4 Planning. `/capacity/forecast` → redirect | **Done** |
| Scenarios | SP-2.7 | `/capacity/scenarios` — stub | Stub done |

**Route shells:** SP-0 created placeholder pages under `app/(dashboard)/capacity/*`. Each track replaces its placeholder when its checklist is complete.

---

## Section boundaries (avoid overlap)

| Capacity track | Teams / People / Overview |
| --- | --- |
| **Overview** | Org capacity *position* — not executive health score (SP-1) |
| **Utilization** | Logged/commercial consumption vs capacity — not bench slack (SP-2.6) |
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

*Last updated: 2026-11-17 — Capacity Overview: monthly breakdown with plan months, breakdowns, export and month links; month to date section; role people. Next = SP-2.6 Bench.*
