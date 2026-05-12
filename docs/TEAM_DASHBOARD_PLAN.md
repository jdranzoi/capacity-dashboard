# Team dashboard — implementation plan

Progressive build-out for `/team`, inspired by the capacity staffing mock (not pixel-identical). Targets **v2 tables only** (`CLAUDE.md`, D-019). Read-only Supabase via service role in server loaders.

## Architecture boundaries

| Layer | Responsibility |
| --- | --- |
| **`lib/domain/*.ts`** | Pure functions: utilization (C-005 when applicable), `loggedVersusPlannedProductivityPct`, `billableVersusLoggedEfficiencyPct`, aggregates, period-over-period change. No Supabase. |
| **`lib/team/load-*.ts`** | Supabase reads: resolve latest `snapshot_id` from `sync_snapshot`, filter by `month_date`, join `dim_*` and `fact_*`. Return hours, counts, and raw fields — percentages computed via domain helpers unless a trivial aggregate is documented. |
| **`app/(dashboard)/team/page.tsx` + `components/team/*`** | RSC-first; serialized props; formatting and layout only. |

Charts and cards consume DTOs shaped in loaders using domain functions.

## Screenshot concepts → v2 data (and gaps)

| Mock idea | v2 source | Notes |
| --- | --- | --- |
| Period (month) | `fact_capacity.month_date` / month spine; same pattern as overview (`?month=`) | Reuse or extract `loadOverviewMonthOptions`. |
| “Current operations” vs “future planning” | Not a first-class schema toggle | Phase 2+: UI-only mode or disabled until product definition. |
| Filters: team, role, client, project, region | `dim_person.team`, `dim_role`, `dim_project.client`, plans/worklogs joins, `dim_zone` | URL query params; filter in loader. |
| KPI cards: net capacity, planned, logged, billable, utilization, billable efficiency, open capacity, PTO | `fact_capacity`, `fact_plans` (`is_pto`), `fact_worklogs`, `fact_bench` | Org-level or filtered rollups; PTO from worklogs with `is_pto = true`. |
| Utilization (multiple surfaces) | Capacity + worklogs + working-day math (overview-aligned) | Reuse `personLoggedUtilizationPct` / C-005 per surface definition. |
| Skills / demand | **`dim_person` has no skills column**; `dim_project.tech_stack` is project-level | (A) Derive from assigned projects via `fact_plans`, or (B) defer section until a skill dimension exists. |
| Employment type | **Not in current `dim_person` types** | Placeholder column or hide until ingestion adds field. |
| Sparklines / vs prior period | Same metrics for selected month and **previous month** | Dual load or `loadTeamSeries`; domain helper for delta / `%` change. |

## Layout slots (build order)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ SLOT-A: Page header (title + subtitle)                     [optional Export] │
├──────────────────────────────────────────────────────────────────────────────┤
│ SLOT-B: Context bar — period (month picker) | filter placeholders             │
│         (role, team, client, project, zone — some may stay disabled early)   │
├──────────────────────────────────────────────────────────────────────────────┤
│ SLOT-C: “Current operations” — KPI card row (responsive wrap)                 │
│         value | vs previous period | sparkline TBD                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ SLOT-D: 2×2 analytics grid                                                     │
│   D1: Utilization by role (table + mini bars)                               │
│   D2: Capacity distribution by role group (stacked bar)                      │
│   D3: Headcount by role (bar chart)                                            │
│   D4: Skills metrics (table) or explicit “pending data model” placeholder    │
├──────────────────────────────────────────────────────────────────────────────┤
│ SLOT-E: Staffing grid — TanStack Table, pagination, person-level columns      │
└──────────────────────────────────────────────────────────────────────────────┘
```

Suggested components (create incrementally):

- `components/team/team-page-shell.tsx` — orchestrates slots + `Suspense`
- `components/team/team-toolbar.tsx` — filters (minimal client where needed)
- `components/team/team-kpi-section.tsx` — SLOT-C
- `components/team/team-analytics-grid.tsx` — D1–D4
- `components/team/team-staffing-grid.tsx` — SLOT-E

## Phased implementation

| Phase | Deliverable | Data / code |
| --- | --- | --- |
| **0** | Empty layout + labeled slots (`Skeleton` or “Fill: …”) | No new Supabase surface; structure only. |
| **1** | SLOT-A + minimal SLOT-B: title + month picker via `?month=` (same as `/`) | `loadOverviewMonthOptions` or shared helper. |
| **2** | SLOT-C: real **org-aggregated** KPIs for selected month | Latest `sync_snapshot`; sums from `fact_capacity`, `fact_plans`, `fact_bench`, `fact_worklogs` with worklog date cap aligned to overview. Domain: extend/reuse `workload-metrics.ts` and `utilization.ts` as appropriate. |
| **3** | Prior-month comparison + optional `%` change on cards | Same aggregations for prior `month_date`; domain: e.g. `periodOverPeriodChangePct`. Sparklines last (monthly or weekly series). |
| **4** | Filters (query params) on aggregates + downstream sections | Filter in loader (SQL `in` / post-filter by volume). |
| **5** | SLOT-D1–D3: role / group aggregates | Group-by in loader; Recharts consistent with overview. |
| **6** | SLOT-D4 skills or explicit placeholder | Data model decision. |
| **7** | SLOT-E: staffing grid by person | Loader: `dim_person` + per-person rollups; missing DB fields → em dash or hidden columns. |

## Progress tracker

| ID | Item | Status |
| --- | --- | --- |
| P0 | Page structure + slots + `components/team/` scaffolding | Done |
| P1 | Month picker + URL `searchParams` | Done |
| P2 | Monthly org loader + KPI row using centralized domain | Pending |
| P3 | Previous month comparison + trends | Pending |
| P4 | Persistent filters in URL | Pending |
| P5 | Role widgets: utilization table, distribution, headcount | Pending |
| P6 | Skills section or explicit deferral | Pending |
| P7 | Person-level staffing grid + TanStack Table | Pending |

## Default next implementation step

**Phase 2**: Monthly org-level KPI row — `lib/team/load-team-overview.ts` (or similar) with latest `sync_snapshot`, plus domain helpers; replace skeleton cards in `team-page-shell.tsx` with real data components.

Phases 0 + 1 are implemented (`/team?month=`, shell slots, toolbar filters as disabled placeholders).

## References

- `CLAUDE.md` — v2 tables, snapshot pattern, overview weekly metrics contract (for date caps and proration alignment).
- `lib/domain/workload-metrics.ts`, `lib/domain/utilization.ts` — centralized formulas.
- `lib/overview/load-weekly-overview.ts` — patterns for `dim_person`, `fact_plans`, holidays/PTO.
