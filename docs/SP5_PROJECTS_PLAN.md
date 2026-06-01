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
| **SP-5.3** Staffing | `/projects/staffing` | Placeholder |
| **SP-5.4** Health | `/projects/health` | Placeholder |
| **SP-5.5** Delivery / Financials / Dependencies | — | Coming soon / future |
| **SP-5.6** Zoho pipeline path | — | Documented in PLAN_MASTER |

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

## References

- [PERFORMANCE_ROADMAP.md](./PERFORMANCE_ROADMAP.md) — caching and bundle patterns
- [PLAN_MASTER.md](./PLAN_MASTER.md) — SP-5 scope and data tables
