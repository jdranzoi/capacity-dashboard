# SP-5 Projects — implementation plan

> **Subplan:** SP-5 · **Question:** Which deliveries are at risk?  
> **Master plan:** [PLAN_MASTER.md § SP-5](./PLAN_MASTER.md#sp-5--projects) · **IA spec:** [NAVIGATION_FUNCTIONAL.md § Projects](./NAVIGATION_FUNCTIONAL.md#projects)

Progressive build-out for `/projects/*`. Targets **v2 tables only** (`CLAUDE.md`, D-019).

---

## Progress tracker

| Track | Route | Status |
| --- | --- | --- |
| **SP-5.1** Shell + L2 nav | `/projects/*` | Done (SP-0 scaffolding) |
| **SP-5.2** Overview | `/projects/overview` | **Done** — KPIs, progress chart, global/monthly, detail sheet |
| **SP-5.9** Activity | `/projects/activity` | **Done** — month list from `fact_month_projects`, grouped by type, reuses Overview detail panel |
| **SP-5.3** Staffing | `/projects/staffing` | Placeholder |
| **SP-5.4** Health | `/projects/health` | Placeholder |
| **SP-5.5** Delivery / Financials / Dependencies | — | Coming soon / future |
| **SP-5.6** Zoho pipeline path | — | Documented in PLAN_MASTER |
| **SP-5.7** Training | `/projects/training` | **Done** — MCT KPIs, version/area/topic grids, activity table. Needs migration 024 + `sync:training`. |
| **SP-5.8** Training year | `/projects/training-year` | **Done** — month/role charts, same-period KPIs and role table across years; bar click slices. |

When Overview shipped: add `/projects/overview` to [`lib/navigation/shipped-routes.ts`](../lib/navigation/shipped-routes.ts) (done).

---

## SP-5.2 Projects Overview (shipped)

### Route and nav

- **Route:** `/projects/overview` (redirects: `/projects`, `/projects/portfolio`)
- **Nav label:** Overview (L2 under Projects)

### Data strategy

| Mode | Logged / billable | Planned | Burn rate |
| --- | --- | --- | --- |
| **Monthly** | `fact_project_actuals` for `snapshot_id` + `month_date` | `fact_plans` project grain | Last 3 months from `fact_project_actuals` |
| **Global** | `v_project_delivery_totals` (preferred) or paginated `fact_worklogs` fallback | Sum `fact_plans` in view / fallback | Same 3-month actuals |

**Migration (capacity-mcp):** `supabase/migrations/018_project_delivery_totals_view.sql` — apply before relying on global view in production.

### Code map

| Layer | Path |
| --- | --- |
| Page | `app/(dashboard)/projects/overview/page.tsx` |
| Loaders | `lib/projects/overview/*` |
| Domain | `lib/domain/project-delivery-metrics.ts` |
| UI | `components/projects/overview/*`, `components/projects/_shared/*` |
| Sheet | `components/ui/sheet.tsx` |

### URL params

- `month` — `yyyy-MM` (monthly mode + detail context)
- `view` — `monthly` \| `global`
- `category` — `all` \| `build` \| `support` \| `internal`
- `q` — project name/key search
- `project` — project key for detail sheet

### Deferred

- Forecasted completion date
- KPI month-over-month sublines (Phase 1b)
- `account_manager` row scoping

---

## SP-5.9 Project activity

- **Route:** `/projects/activity`
- **Question:** Which projects logged hours this month?
- **Data:** `fact_month_projects` joined to `dim_project` (same population as Capacity Overview Projects).
- **URL:** `month` (`yyyy-MM`), optional `type` (`build` \| `support` \| `product` \| `internal` \| `other`), `project` (key for the existing detail panel).
- **UI:** Type-grouped sortable tables + reused `ProjectsProjectDetailPanel` (monthly view). Capacity Overview Projects dots/bars open this route in a new tab.
- **Code:** `lib/projects/activity/`, `components/projects/activity/`

## SP-5.7 Training

- **Route:** `/projects/training`
- **Data:** `dim_issue` + `fact_issue_worklogs` (capacity-mcp migration `024_dim_issue.sql`, `sync-training.ts`). MCT only. No `fact_plans`.
- **Grain:** child tickets. Hours vs Jira Original Estimate. Month filter uses Tempo `log_date`.
- **UI:** KPI row, three linked taxonomy grids (Versions → Areas → Topics, i.e. fix versions → components → labels), activity table, missing-value badges. Each grid is a fixed-height scroll panel so the activity table stays in view. Selecting a level narrows the grids to its right (`?version=`, `?component=`, `?topic=`) and resets the narrower ones. A ticket carrying several values is counted in each matching row, so the counts do not sum to the activity total.
- **Code:** `lib/projects/training/`, `components/projects/training/`

---

## SP-5.8 Training year

- **Route:** `/projects/training-year` (does not replace `/projects/training`)
- **Scope:** current calendar year is the focus; month charts, YTD KPIs, and the role table include every year with child-ticket Tempo hours. No toolbar filters. Click a month, role, version or area (or a role table row) to slice (`?month=yyyy-MM`, `?role=`, `?version=`, `?component=`).
- **Charts:** hours and trainings by month and by role, grouped by year. Child tickets only. Role from the person who logged. Role charts, KPIs, and the role table use the same months (Jan through the current month, or the selected month).
- **Versions / Areas:** horizontal paired bars, current year against the same months of the prior year. Bar length toggles between logged hours and share of that year's training hours (share keeps a partial year comparable). Versions lists every fix version with hours; areas are capped at the top 12 components and scope to the selected version. All four slices (`month`, `role`, `version`, `component`) cross-filter the other charts and the KPI row.
- **Code:** `lib/projects/training-year/`, `components/projects/training-year/`

---

## References

- [PERFORMANCE_ROADMAP.md](./PERFORMANCE_ROADMAP.md) — caching and bundle patterns
- [PLAN_MASTER.md](./PLAN_MASTER.md) — SP-5 scope and data tables
