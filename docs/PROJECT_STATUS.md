# Project status — resume here

Lightweight checkpoint for agents and contributors. Update this file when a subplan milestone completes.

**Authoritative plans:** [NAVIGATION_FUNCTIONAL.md](./NAVIGATION_FUNCTIONAL.md) (IA spec) · [PLAN_MASTER.md](./PLAN_MASTER.md) (subplans SP-0–SP-7) · **[SP2_CAPACITY_PLAN.md](./SP2_CAPACITY_PLAN.md)** (active — isolated Capacity tracks)

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

**SP-2 — Capacity** ([SP2_CAPACITY_PLAN.md](./SP2_CAPACITY_PLAN.md))

SP-0 navigation is done. **SP-2.0 Foundation** and **SP-2.2 Overview** are shipped. Next track: **SP-2.6 Bench** (recommended order in [SP2_CAPACITY_PLAN.md](./SP2_CAPACITY_PLAN.md)).

| Track | Route | Status | Plan anchor |
|---|---|---|---|
| SP-2.0 Foundation | — | **Done** | [§ SP-2.0](./SP2_CAPACITY_PLAN.md#shared-foundation-sp-20) |
| SP-2.2 Overview | `/capacity/overview` | **Done** | [§ SP-2.2](./SP2_CAPACITY_PLAN.md#sp-22--overview-capacityoverview) |
| SP-2.3 Operations | `/capacity/operations` | Not started | [§ SP-2.3](./SP2_CAPACITY_PLAN.md#sp-23--operations-capacityoperations) |
| SP-2.4 Planning | `/capacity/planning` | Not started | [§ SP-2.4](./SP2_CAPACITY_PLAN.md#sp-24--planning-capacityplanning) |
| SP-2.5 Allocations | `/capacity/allocations` | Not started | [§ SP-2.5](./SP2_CAPACITY_PLAN.md#sp-25--allocations-capacityallocations) |
| SP-2.6 Bench | `/capacity/bench` | Not started | [§ SP-2.6](./SP2_CAPACITY_PLAN.md#sp-26--bench-capacitybench) |
| SP-2.7 Forecast / Scenarios | `/capacity/forecast`, `/capacity/scenarios` | Stub done | [§ SP-2.7](./SP2_CAPACITY_PLAN.md#sp-27--forecast--scenarios) |

**Parallel work:** SP-4 Teams tracks starting alongside SP-2.

| Track | Route | Status | Notes |
|---|---|---|---|
| SP-4.1 Teams Overview | `/teams/overview` | **Done** | Org-structure snapshot: headcount, roles, geographic distribution + coming-soon placeholders |
| SP-4.2 Teams Composition | `/teams/composition` | Not started | Project teams view: cards per project grouped by build/support, ordered by PM, name filter |
| SP-4.x other Teams sub-sections | `/teams/*` | Placeholders | Composition, Staffing, Dependencies, Health, Skills coverage — to be planned per track |

**Deferred:** SP-1 Overview · SP-3 People · legacy `/team` route migration.

---

## Current routes (code today)

| Route | Label | Notes |
|---|---|---|
| `/` | Overview | **Substantial** — weekly cards, KPIs, charts |
| `/capacity/overview` | Capacity → Overview | **Shipped** — KPIs, charts, role summary |
| `/capacity/utilization` | Capacity → Utilization | **Shipped** — role/person dashboard (from `/teams`) |
| `/capacity/*` (other) | Capacity sub-sections | Placeholders (hidden in nav) |
| `/teams` | Teams | Redirects → `/teams/overview` |
| `/teams/overview` | Teams → Overview | **Shipped** — org structure snapshot |
| `/teams/*` (other) | Teams sub-sections | Placeholders |
| `/projects/*` | Projects | Level 2 shells (redirect from `/projects` → portfolio) |
| `/ask` | Ask | Transversal utility (sidebar bottom) |
| `/team` | — | Redirects → `/capacity/utilization` |
| `/flags`, `/pipeline` | — | Redirect → `/` |

---

## Built vs planned (by subplan)

| Subplan | Built today | Target |
|---|---|---|
| SP-1 Overview | Weekly section, workload charts, KPI blocks, loaders in `lib/overview/` | **Deferred** — extend after Capacity widgets exist |
| SP-2 Capacity | `/capacity/overview` shipped; other tracks pending | [SP2_CAPACITY_PLAN.md](./SP2_CAPACITY_PLAN.md) |
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
| Capacity UI (planned) | `components/capacity/{subsection}/`, `_shared/` |
| Capacity data (planned) | `lib/capacity/{subsection}/`, `shared/` |
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

*Last updated: SP-4.1 Teams Overview shipped; next = SP-2.6 Bench or SP-4.2 Teams Composition.*
