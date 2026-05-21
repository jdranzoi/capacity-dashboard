# Project status — resume here

Lightweight checkpoint for agents and contributors. Update this file when a subplan milestone completes.

**Authoritative plans:** [NAVIGATION_FUNCTIONAL.md](./NAVIGATION_FUNCTIONAL.md) (IA spec) · [PLAN_MASTER.md](./PLAN_MASTER.md) (subplans SP-0–SP-7)

---

## Product

**Workforce Intelligence** — Engineering Operations Intelligence Platform (read-only dashboard for Mira Commerce).

---

## Phase

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Auth, layout, sidebar, v2 data plumbing, Overview weekly metrics | **Done** |
| Phase 1 | Overview, Capacity, People, Teams, Projects + navigation restructure | **In progress** |
| Phase 2 | Insights, Reports | Not started |

---

## Next work (start here)

**SP-1 — Overview** ([PLAN_MASTER.md § SP-1](./PLAN_MASTER.md#sp-1--overview))

SP-0 navigation is done. Extend Overview (org health, alerts strip) or start **SP-3 People** / **SP-4 Teams** migration split.

---

## Current routes (code today)

| Route | Label | Notes |
|---|---|---|
| `/` | Overview | **Substantial** — weekly cards, KPIs, charts |
| `/capacity/*` | Capacity | Level 2 shells (redirect from `/capacity` → overview) |
| `/people/*` | People | Level 2 shells (redirect from `/people` → directory) |
| `/teams` | Teams → Utilization | **Migrated** from `/team` — full team dashboard |
| `/teams/*` | Teams sub-sections | Placeholder shells except Utilization |
| `/projects/*` | Projects | Level 2 shells (redirect from `/projects` → portfolio) |
| `/ask` | Ask | Transversal utility (sidebar bottom) |
| `/team` | — | Redirects → `/teams` |
| `/flags`, `/pipeline` | — | Redirect → `/` |

---

## Built vs planned (by subplan)

| Subplan | Built today | After SP-0+ |
|---|---|---|
| SP-1 Overview | Weekly section, workload charts, KPI blocks, loaders in `lib/overview/` | Extend: org health, alerts strip |
| SP-2 Capacity | Metrics only on Overview | New `/capacity` + Level 2 |
| SP-3 People | Part of `/team` (`components/team/`, `lib/team/`) | `/people` + migration |
| SP-4 Teams | Part of `/team` (staffing grid, role analytics) | `/teams` + migration |
| SP-5 Projects | None (pipeline stub only) | New `/projects` |
| SP-6 Insights | `/flags` proto | Phase 2 |
| SP-7 Reports | None | Phase 2 |

---

## Key code locations

| Area | Path |
|---|---|
| Sidebar | `components/layout/sidebar.tsx` |
| Overview UI | `components/overview/` |
| Team UI (→ People + Teams) | `components/team/` |
| Overview data | `lib/overview/load-weekly-overview.ts` |
| Team data | `lib/team/` |
| Domain formulas | `lib/domain/workload-metrics.ts`, `lib/domain/utilization.ts` |
| Display rounding | `lib/format/display-stats.ts` |

---

## Sidebar target (Phase 1 active)

```
Overview    /
Capacity    /capacity
People      /people
Teams       /teams
Projects    /projects
────────────
Ask         /ask
```

**Not in sidebar (Phase 2):** Insights, Reports.

---

*Last updated: SP-0 navigation architecture implemented in code.*
