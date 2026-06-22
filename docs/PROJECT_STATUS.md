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
| Phase 1 | Overview, Capacity, Teams, Projects + navigation restructure | **In progress** |
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
| SP-2.4 Planning | `/capacity/planning` | **Done** | [§ SP-2.4](./SP2_CAPACITY_PLAN.md#sp-24--planning-capacityplanning) |
| SP-2.5 Allocations | `/capacity/allocations` | Not started | [§ SP-2.5](./SP2_CAPACITY_PLAN.md#sp-25--allocations-capacityallocations) |
| SP-2.6 Bench | `/capacity/bench` | Not started | [§ SP-2.6](./SP2_CAPACITY_PLAN.md#sp-26--bench-capacitybench) |
| SP-2.7 Forecast / Scenarios | `/capacity/forecast`, `/capacity/scenarios` | Stub done | [§ SP-2.7](./SP2_CAPACITY_PLAN.md#sp-27--forecast--scenarios) |

**Parallel work:** SP-4 Teams · SP-5 Projects Overview shipped ([SP5_PROJECTS_PLAN.md](./SP5_PROJECTS_PLAN.md)).

| Track | Route | Status | Notes |
|---|---|---|---|
| SP-4.1 Teams Overview | `/teams/overview` | **Done** | Org-structure snapshot: headcount, roles, geographic distribution + coming-soon placeholders |
| SP-4.2 Teams Composition | `/teams/composition` | **Done** | Project teams cards grouped by build/support, ordered by PM, `?q=` name filter |
| SP-4.3 Teams Collaboration | `/teams/collaboration-network` | **Done** | Cross-project collaboration network graph + KPI row |
| SP-4.x other Teams sub-sections | `/teams/*` | Placeholders | Staffing, Dependencies, Health, Skills coverage — to be planned per track |

**Deferred:** SP-1 Overview.

---

## Current routes (code today)

| Route | Label | Notes |
|---|---|---|
| `/` | Overview | **Substantial** — weekly cards, KPIs, charts |
| `/capacity/overview` | Capacity → Overview | **Shipped** — KPIs, charts, role summary |
| `/capacity/utilization` | Capacity → Utilization | **Shipped** — role/person dashboard (`components/capacity/utilization/`) |
| `/capacity/planning` | Capacity → Planning | **Shipped** — dual-tab workspace (People + Project planning) |
| `/teams` | Teams | Redirects → `/teams/overview` |
| `/teams/overview` | Teams → Overview | **Shipped** — org structure snapshot |
| `/teams/composition` | Teams → Composition | **Shipped** — project team cards by type |
| `/teams/*` (other) | Teams sub-sections | Placeholders |
| `/projects/overview` | Projects → Overview | **Shipped** — delivery KPIs, progress chart, detail sheet |
| `/projects/*` (other) | Projects sub-sections | Placeholders (redirect `/projects` → overview) |
| `/ask` | Ask | Transversal utility (sidebar bottom) |
| `/team` | — | Permanent redirect → `/capacity/utilization` (`next.config.ts`) |
| `/flags`, `/pipeline` | — | Redirect → `/` |

---

## Built vs planned (by subplan)

| Subplan | Built today | Target |
|---|---|---|
| SP-1 Overview | Weekly section, workload charts, KPI blocks, loaders in `lib/overview/` | **Deferred** — extend after Capacity widgets exist |
| SP-2 Capacity | `/capacity/overview`, `/capacity/utilization`, `/capacity/planning` shipped; other tracks pending | [SP2_CAPACITY_PLAN.md](./SP2_CAPACITY_PLAN.md) |
| SP-4 Teams | `/teams/overview`, `/teams/composition`, `/teams/collaboration-network` shipped | `/teams/*` remaining sub-sections |
| SP-5 Projects | `/projects/overview` shipped | [SP5_PROJECTS_PLAN.md](./SP5_PROJECTS_PLAN.md) |
| SP-6 Insights | `/flags` proto | Phase 2 |
| SP-7 Reports | None | Phase 2 |

---

## Key code locations

| Area | Path |
|---|---|
| Sidebar | `components/layout/sidebar.tsx` |
| Overview UI | `components/overview/` |
| Capacity UI | `components/capacity/{subsection}/`, `_shared/`, `utilization/` |
| Capacity data | `lib/capacity/{subsection}/`, `shared/`, `utilization/` |
| Workforce shared (roster, filters) | `lib/workforce/` |
| Teams UI | `components/teams/` |
| Teams data | `lib/teams/` |
| Overview data | `lib/overview/load-weekly-overview.ts` |
| Domain formulas | `lib/domain/workload-metrics.ts`, `lib/domain/utilization.ts` |
| Display rounding | `lib/format/display-stats.ts` |

---

## Sidebar target (Phase 1 active)

```
Overview    /
Capacity    /capacity
Teams       /teams
Projects    /projects
────────────
Ask         /ask
```

**Not in sidebar (Phase 2):** Insights, Reports.

---

*Last updated: SP-2.4 Planning workspace shipped (`/capacity/planning` — People + Project tabs).*
