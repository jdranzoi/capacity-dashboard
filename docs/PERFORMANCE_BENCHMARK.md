# Dashboard performance benchmarks

Repeatable baseline for **main** (post Phase 1 + Phase 2) and future phases (3–4).  
Environment: local `pnpm dev`, `http://localhost:3000`, authenticated session required for dashboard routes.

## How to run

### 1. Server timings (authoritative for loaders)

Dev blocks log wall-clock per section:

```text
[perf] overview/toolbar: …ms
[perf] overview/kpis: …ms
…
```

1. `pnpm dev`
2. Log in via browser (Google OAuth).
3. Walk through [Flows](#flows) below.
4. Copy lines matching `[perf]` from the terminal into the tables for the run date.

`lib/dev/perf-log.ts` is dev-only (`NODE_ENV === 'development'`).

### 2. Browser (UX / streaming)

Use Cursor browser MCP or Chrome DevTools:

- **Streaming:** toolbar visible before KPI row before charts (overview).
- **Month change:** section skeletons in place (no full-page overlay).
- **Network:** RSC flight timing (DevTools → Network → document / RSC requests).

### 3. curl (unauthenticated — redirect only)

```bash
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' http://localhost:3000/
```

Expect `307` → `/login`. Not valid for dashboard data timing.

## Flows

| ID | Flow | Route | What to record |
| --- | --- | --- | --- |
| A | Cold load | `/` | `[perf]` for toolbar, kpis, charts, weekly-detail (order + ms) |
| B | Month change | `/?month=YYYY-MM` | Section skeletons? `[perf]` on warm cache (2nd navigation) |
| C | Cold load | `/team` | header, toolbar, kpis, analytics, staffing |
| D | Filter change | `/team?month=…&role=…` | Same as C, warm |
| E | Placeholder | `/flags`, `/pipeline`, `/ask` | Time to first paint (minimal data) |
| F | Layout | any | Sidebar immediate? Header skeleton only? |

## Results — main (Phase 1 + 2)

**Date:** 2026-05-20  
**Commit:** `76b89c9` (post Phase 1 + 2; includes dev `[perf]` instrumentation)  
**Environment:** `pnpm dev`, `localhost:3000`, authenticated browser session  
**Next.js route timing:** from dev terminal `GET … (proxy.ts + application-code)`

### Overview `/` — cold (full page load, May 2026)

| Section | Server `[perf]` (ms) | Route `GET /` total |
| --- | --- | --- |
| toolbar | 6546 | **~8.0 s** (proxy ~1.3 s, app ~6.7 s) |
| kpis | 6542 | (parallel — same wall clock as toolbar) |
| charts | 6541 | |
| weekly-detail | 6540 | |

All four sections finish together because they share `getOverviewWeeklyData` (`React.cache`); bottleneck is one Supabase bundle + rollup per month.

### Overview `/` — warm (reload same month, cache hot)

| Section | Server `[perf]` (ms) | Route `GET /` total |
| --- | --- | --- |
| toolbar | 1051 | **~2.5 s** (proxy ~1.3 s, app ~1.2 s) |
| kpis | 1049 | |
| charts | 1048 | |
| weekly-detail | 1047 | |

### Overview — month change (`?month=2026-04`, new cache key)

| Section | Server `[perf]` (ms) | Route total |
| --- | --- | --- |
| toolbar | 3212 | **~3.7 s** |
| kpis | 3209 | |
| charts | 3208 | |
| weekly-detail | 3208 | |

Browser: subtitle updated in **~2 s** (`browser_wait_for`). Section skeletons via `OverviewRouteSection` (no full-page overlay observed).

### Team `/team` — cold (default month, cache warm from overview)

| Section | Server `[perf]` (ms) | Route `GET /team` total |
| --- | --- | --- |
| header | 30 | **~6.8 s** (proxy ~0.6 s, app ~6.2 s) |
| toolbar | 3541 | |
| kpis | 4093 | |
| analytics | 4570 | |
| staffing | 1461 | (nested Suspense inside analytics) |

### Team — heavy cold (`/team?month=2026-01`, earlier run)

| Section | Server `[perf]` (ms) | Route total |
| --- | --- | --- |
| header | 5104 | **~15.9 s** |
| toolbar | 10209 | |
| kpis | 12849 | |
| analytics | 13314 | |
| staffing | 1434 | |

Team remains the slowest route: bootstrap + KPIs + analytics each touch large fact sets (staffing benefits from bundle cache after analytics).

### Other routes

| Route | `GET` total | Notes |
| --- | --- | --- |
| `/flags` | ~1.2 s | Placeholder only — no `[perf]` spans |
| `/pipeline` | ~3.0 s | Placeholder; includes compile on first hit |
| `/ask` | (instant shell) | Placeholder |

### UX checklist (Phase 2) — 2026-05-20 run

- [x] Sidebar visible while header loads
- [x] Overview: 4 sections present after load (parallel finish — not staggered by >1 s yet)
- [x] Overview: month change updates without full-page blur overlay
- [x] Team: toolbar / KPIs / analytics / staffing render on `/team`
- [x] Team: staffing grid inside analytics region

### Findings (actionable for Phase 3+)

1. **Dominant cost:** Supabase reads in month fact bundle (~6–13 s cold). `'use cache'` helps **repeat** same month (~1 s); **new month** still ~3 s.
2. **Proxy/middleware:** `proxy.ts` often **0.5–1.5 s** per navigation — worth profiling separately from loaders.
3. **Team KPIs + analytics** still expensive on cold month (~10–13 s each wall clock when cache cold) — Phase 3 month rollup + shared bootstrap materialization targets this.
4. **Per-section `[perf]`** does not yet split bundle fetch vs in-memory rollup — optional finer spans later.

## Results — Phase 3+ (template)

Copy the tables above per phase. Compare:

- `overview/toolbar` should drop when month rollup replaces full `fact_capacity` scan.
- Warm `kpis` / `charts` / `weekly-detail` should stay low (`React.cache` + `use cache`).

## References

- `docs/PERFORMANCE_ROADMAP.md` — phase plan
- `lib/dev/perf-log.ts` — server span helper
