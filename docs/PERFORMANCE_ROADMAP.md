# Dashboard performance — implementation roadmap

Cross-route plan for the **whole dashboard web app (WAP)**: data routes under `app/(dashboard)/`, shared layout chrome, and future Phase C views (`/flags`, `/pipeline`). Complements feature-specific docs (e.g. `TEAM_DASHBOARD_PLAN.md`). Targets **v2 tables only**, read-only Supabase (service role, server-side), and **unchanged** domain formulas (C-005, overview weekly contract, display rounding).

New data-heavy routes **must** follow the layers and rules in this doc (bundle + `'use cache'` + `connection()` at page boundary) unless documented otherwise.

## Route coverage (WAP)

| Route | Phase 1 (data/cache) | Phase 2 (streaming UX) | Notes |
| --- | --- | --- | --- |
| `/` (overview) | **Done** | **Done** — per-section `Suspense` + `OverviewRouteSection` | `overview-page-cache.ts` dedupes loaders per request |
| `/team` | **Done** | **Done** — toolbar / KPIs / analytics / nested staffing `Suspense` | `team-page-cache.ts` |
| Layout (`sidebar`, `header`) | Partial — `SyncStatus` cached | **Done** — sidebar static; `Header` only in `Suspense` | Middleware handles auth redirect |
| `/flags`, `/pipeline` | N/A (placeholders) | N/A | Apply this roadmap when real loaders land |
| `/ask` | Not started | Not started | API route + audit; separate from month-fact bundle |
| `/login` | Out of scope | Out of scope | Auth only |

## Problem statement

| Symptom | Root cause |
| --- | --- |
| Multi-second loads on first paint | Heavy paginated Supabase reads; almost no `'use cache'` on data loaders |
| Slow `?month=` / filter changes | `connection()` on loaders + full refetch; team route repeated the same fact queries 4–5× sequentially |
| Full-page skeleton on period change | Single route-level `Suspense` + `*RoutePendingShell` overlay (PPR does not re-show Suspense on search-only navigation) |
| Layout feels blocked | `DashboardChrome` wrapped in one `Suspense` until `getUser()` completes (middleware already redirects unauthenticated users) |

## Architecture boundaries

| Layer | Responsibility |
| --- | --- |
| **`lib/data/load-month-fact-bundle.ts`** | One paginated fetch set per `(snapshot_id, month_date)`; `'use cache'` + `React.cache` dedup |
| **`lib/overview/*.ts`** | Overview-specific rollups (weekly proration, org MTD) from bundle + dynamic `asOf` cap |
| **`lib/team/load-*.ts`** | Team KPIs, role analytics, staffing — consume bundle; avoid duplicate `fact_*` scans |
| **`app/(dashboard)/*`** | `connection()` at page boundary; parallel `Promise.all` where independent |
| **Components** | Presentation only; per-card `Suspense` in Phase 2 |

## Security vs caching

- Cache keys: **`snapshotId` + `monthStartStr`** (and filter signature when scoped). Snapshot is the ingestion anchor (C-003).
- **No** `cookies()` / `headers()` inside `'use cache'` functions.
- Service role stays server-only (`createServiceClientCached`).
- **MTD worklog cap** (`min(month end, last sync, today)`): bundle stores rows through **calendar month end**; loaders apply `logThroughStr` in memory so formulas stay correct without busting cache every request.
- Role-based row filtering (`account_manager`) is not in loaders yet; when added, pass role scope as a cache argument or bypass cache for that role.

## Phased implementation

| Phase | Deliverable | Status |
| --- | --- | --- |
| **1** | Shared month fact bundle (`use cache` + `React.cache`); cache `loadOverviewMonthOptions`; refactor `loadWeeklyOverview` + team analytics/staffing to use bundle; parallel team loader chain | **Done** |
| **2** | Per-card / per-section `Suspense` on overview + team; shrink layout `Suspense`; lighten route pending overlays | **Done** |
| **3** | DB month rollup (`v_dashboard_month_options`) replacing full `fact_capacity` scan for month picker | **Done** |
| **4** | `cacheTag` invalidation via `POST /api/revalidate` (sync webhook or manual) | **Done** |

## Phase 1 — detail (data layer)

### 1a — Month fact bundle

**File:** `lib/data/load-month-fact-bundle.ts`

- Parallel paginated reads: `fact_capacity`, `fact_plans` (non-PTO), `fact_worklogs` (non-PTO with `project_id`, through month end), `fact_worklogs` (PTO, through month end), `dim_holiday` (through month end).
- `'use cache'` + `cacheLife({ stale: 120, revalidate: 300 })` + tags `month-facts`, `snapshot-{id}`.
- `getMonthFactBundle = cache(...)` for request-level dedup when overview + team loaders run in the same RSC tree.

### 1b — Cached month options

**File:** `lib/overview/overview-month-options.ts`

- `'use cache'` on `loadOverviewMonthOptions` (`cacheLife('hours')`, tag `overview-months`).
- Remove `connection()` from loader; callers keep `connection()` at page boundary.

### 1c — Consumers

| Consumer | Change |
| --- | --- |
| `loadWeeklyOverview` | Read bundle; filter by `personIdFilter` and `logThroughStr` in memory; remove duplicate Supabase fact queries |
| `loadTeamRoleAnalytics` | Same bundle |
| `loadTeamStaffingRows` | Same bundle (uses `project_id` on worklog rows) |
| `team-page-data.tsx` | `Promise.all` for filter options + person scope; then `Promise.all` for KPIs + analytics + staffing |

### 1d — Not in Phase 1

- Per-card Suspense (Phase 2).
- `loadTeamFilterOptions` / `resolveFilteredPersonIds` still issue their own queries (smaller than full fact bundle).
- Project-scoped KPI query (`loadProjectScopedHours`) unchanged.

## Phase 2 — streaming UX (preview)

```
OverviewPage (static shell)
├── MonthPickerSection     [Suspense + skeleton]
├── KpiCardsRow            [Suspense × 5]
├── ChartsRow              [Suspense × 3]
└── WeeklyTableSection     [Suspense]

TeamPage — same pattern for toolbar / KPIs / analytics / staffing grid
```

Keep `useTransition` on month picker for search-only navigation; replace full-page overlay with in-place card skeletons.

## Progress tracker

| ID | Item | Status |
| --- | --- | --- |
| P1a | `load-month-fact-bundle.ts` + cache tags | Done |
| P1b | `loadOverviewMonthOptions` cached | Done |
| P1c | `loadWeeklyOverview` uses bundle | Done |
| P1d | Team role + staffing use bundle | Done |
| P1e | `team-page-data` parallel loads | Done |
| P1f | Overview `/` uses cached month options + bundle via `loadWeeklyOverview` | Done |
| P2a | Overview per-section Suspense + `OverviewRouteSection` | Done |
| P2b | Team per-section Suspense + nested staffing slot | Done |
| P2c | Layout chrome Suspense shrink (header only) | Done |
| P3 | `v_dashboard_month_options` view + loader | Done |
| P4 | `POST /api/revalidate` + `invalidateDashboardCache` | Done |

## Phase 3 — month options view

**Migration (capacity-mcp):** `supabase/migrations/016_dashboard_month_options_view.sql`

- View `v_dashboard_month_options`: one row per `fact_capacity.month_date` with the newest `sync_snapshot` for that month (`DISTINCT ON` + `ORDER BY` sync time).
- **Dashboard:** `loadOverviewMonthOptions` reads the view in a single query (no paginated `fact_capacity` scan).

Apply migration to Supabase before deploying the dashboard change.

## Phase 4 — post-sync cache invalidation

**Endpoint:** `POST /api/revalidate`

| Item | Detail |
| --- | --- |
| Auth | `Authorization: Bearer <DASHBOARD_CACHE_REVALIDATE_SECRET>` or header `x-revalidate-secret` |
| Body (optional) | `{ "snapshotId": "<uuid>" }` — also busts `snapshot-{id}` tag |
| Tags cleared | `overview-months`, `month-facts`, and optional snapshot tag |
| Middleware | `/api/revalidate` bypasses Google OAuth (secret-only) |

**Env:** `DASHBOARD_CACHE_REVALIDATE_SECRET` in Vercel (and `.env.local` for local tests).

**Sync hook (capacity-mcp / GitHub Actions):** after `sync-v2` succeeds, call the dashboard URL:

```bash
curl -sS -X POST "$DASHBOARD_URL/api/revalidate" \
  -H "Authorization: Bearer $DASHBOARD_CACHE_REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"snapshotId\":\"$SNAPSHOT_ID\"}"
```

Omit `snapshotId` to invalidate only global tags (month list + all month-fact entries).

## References

- `docs/PERFORMANCE_BENCHMARK.md` — how to run benchmarks, baseline tables, Phase 3+ comparison template
- `lib/dev/perf-log.ts` — dev-only `[perf]` spans on section loaders
- `CLAUDE.md` — overview weekly metrics, display stats, caching conventions
- `.agents/skills/next-cache-components/SKILL.md` — `'use cache'`, `cacheLife`, `connection()`
- `docs/TEAM_DASHBOARD_PLAN.md` — team feature phases (orthogonal to this perf roadmap)
