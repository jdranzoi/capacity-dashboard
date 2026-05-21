# Workforce Intelligence — Master Plan

> This document tracks the build-out of the Workforce Intelligence platform (capacity-dashboard).
> Each subplan defines scope, current state, data availability, and implementation steps.
> Navigation is the first subplan because it is the structural foundation all other work depends on.

**Resume checkpoint (update when milestones complete):** [PROJECT_STATUS.md](./PROJECT_STATUS.md)  
**IA spec:** [NAVIGATION_FUNCTIONAL.md](./NAVIGATION_FUNCTIONAL.md)

---

## Platform phases

| Phase   | Scope                                                        | Status          |
| ------- | ------------------------------------------------------------ | --------------- |
| Phase 0 | Foundation: auth, layout, sidebar, data plumbing             | **Done**        |
| Phase 1 | Active sections: Overview, Capacity, People, Teams, Projects | **In progress** |
| Phase 2 | Intelligence layer: Insights, Reports                        | Not started     |

---

## Subplan index

| #    | Subplan                 | Depends on | Phase |
| ---- | ----------------------- | ---------- | ----- |
| SP-0 | Navigation architecture | —          | 1     |
| SP-1 | Overview                | SP-0       | 1     |
| SP-2 | Capacity                | SP-0       | 1     |
| SP-3 | People                  | SP-0       | 1     |
| SP-4 | Teams                   | SP-0       | 1     |
| SP-5 | Projects                | SP-0       | 1     |
| SP-6 | Insights                | SP-1–5     | 2     |
| SP-7 | Reports                 | SP-1–5     | 2     |

---

---

## SP-0 — Navigation architecture

> First to build. Everything else plugs into this structure.

### Goal

Restructure the sidebar from the current flat 5-item list to the 2-level hierarchy defined in `NAVIGATION_FUNCTIONAL.md`. Establish the routing and layout foundation for all Phase 1 sections.

### Current state

The sidebar currently has 5 flat items:

| Current route | Current label | Maps to                                    |
| ------------- | ------------- | ------------------------------------------ |
| `/`           | Overview      | SP-1 Overview (keep)                       |
| `/team`       | Team          | SP-4 Teams (rename + split)                |
| `/flags`      | Flags         | SP-6 Insights proto (deactivate)           |
| `/pipeline`   | Pipeline      | SP-5 Projects future (deactivate)          |
| `/ask`        | Ask           | Transversal utility (keep, move to bottom) |

The sidebar has no Level 2 navigation. All pages are flat.

### Target state

```
Sidebar (Level 1 — always visible):
  Overview         /
  Capacity         /capacity
  People           /people
  Teams            /teams
  Projects         /projects
  ─────────────────────────
  Ask              /ask       ← utility, visually separated

Contextual nav (Level 2 — appears when section is active):
  See NAVIGATION_FUNCTIONAL.md for per-section sub-items
```

Sections NOT in sidebar (deactivated for Phase 1):

- Insights `[phase 2]`
- Reports `[phase 2]`

### Implementation steps

- [x] **SP-0.1** Define route structure — new folders under `app/(dashboard)/`
  - `/capacity`, `/people`, `/teams`, `/projects`
  - Each with `page.tsx` (initial shell) and `layout.tsx` (for Level 2 nav)
- [x] **SP-0.2** Update `components/layout/sidebar.tsx`
  - Replace flat `navItems` array with Phase 1 sections only
  - Add visual separator before Ask utility item
  - Keep existing CSS-variable collapse pattern
- [x] **SP-0.3** Build Level 2 contextual nav component
  - `components/layout/section-nav.tsx` — renders sub-items for the active Level 1 section
  - Driven by a config map (section → sub-items → route)
  - Integrates into each section's `layout.tsx` (not the root layout)
- [x] **SP-0.4** Migrate existing content to new routes
  - `/team` → `/teams` (redirect + component migration)
  - `/flags` → deactivated (404 or redirect to `/`)
  - `/pipeline` → deactivated (404 or redirect to `/`)
- [x] **SP-0.5** Update `CLAUDE.md` Core views table to reflect new routes

### Data dependencies

None — this is a structural/routing task.

### Notes

- The existing `/team` components (`components/team/`) map to SP-4 Teams. They will be kept in place and the route migrated.
- The `/flags` and `/pipeline` pages are minimal — no significant work will be lost by deactivating them.
- Level 2 nav should be a server component receiving its config as props, not a client component.

---

---

## SP-1 — Overview

> Executive landing. Answers: "How healthy is the org?"

### Current state — substantial work done

**Routes:** `/` (active)

**Components built (`components/overview/`):**

| Component                                  | Description                                                      |
| ------------------------------------------ | ---------------------------------------------------------------- |
| `weekly-headline-section.tsx`              | Weekly cards: net capacity, planned, PTO, billable, logged hours |
| `overview-workload-charts.tsx`             | 8-week trend charts                                              |
| `overview-kpi-block.tsx`                   | Headline KPIs block                                              |
| `overview-charts-block.tsx`                | Chart rendering shell                                            |
| `overview-weekly-detail-block.tsx`         | Weekly detail table                                              |
| `overview-headline-parts.tsx`              | KPI metric display parts                                         |
| `overview-month-picker.tsx`                | Month selector                                                   |
| `overview-toolbar-block.tsx`               | Toolbar (month picker + controls)                                |
| `overview-route-section.tsx`               | Route-level section wrapper                                      |
| `overview-route-pending-shell.tsx`         | Suspense shell                                                   |
| `overview-section-skeletons.tsx`           | Loading skeletons                                                |
| `overview-data-error.tsx`                  | Error boundary display                                           |
| `components/dashboard/kpi-metric-card.tsx` | Reusable KPI card                                                |

**Loaders built (`lib/overview/`):**

| File                        | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `load-weekly-overview.ts`   | Main overview data loader                              |
| `overview-metrics.ts`       | Display formatters (fmtHoursKpi, fmtPct, fmtHoursCell) |
| `overview-page-cache.ts`    | Cache configuration                                    |
| `overview-month-options.ts` | Available months                                       |
| `prorate-to-weeks.ts`       | Week proration logic                                   |
| `elapsed-net-weekdays.ts`   | Net weekday computation                                |
| `worklog-through-date.ts`   | Worklog date cap logic                                 |
| `working-days.ts`           | Working day helpers                                    |

**Domain logic (`lib/domain/`):**

| File                  | Description                                                 |
| --------------------- | ----------------------------------------------------------- |
| `workload-metrics.ts` | Core KPI formulas (utilization, efficiency, capacity share) |
| `utilization.ts`      | C-005 formal utilization formula                            |

### What remains for Overview

- [ ] **SP-1.1** Org health summary card (single composite score — risk/healthy/pressure)
- [ ] **SP-1.2** Top alerts strip (surface highest-priority flags from underlying data)
- [ ] **SP-1.3** Project portfolio health thumbnail (summary counts by status/risk)
- [ ] **SP-1.4** Integrate into SP-0 Level 2 nav structure (Overview has no sub-sections, it is a single page)

### Data available

All Overview data comes from Supabase v2 tables already queried by existing loaders. No new data sources needed for SP-1.1–1.3.

---

---

## SP-2 — Capacity

> Answers: "Can we absorb work?"

### Current state — partial

The existing Overview page surfaces capacity metrics (net capacity, planned, bench, utilization) at the org level. No dedicated `/capacity` route or Capacity-specific components exist yet.

**Relevant existing lib files:**

| File                                   | Reusable for Capacity             |
| -------------------------------------- | --------------------------------- |
| `lib/data/load-month-fact-bundle.ts`   | Loads capacity, plans, bench data |
| `lib/data/latest-sync-snapshot.ts`     | Snapshot resolution               |
| `lib/domain/workload-metrics.ts`       | Capacity KPI formulas             |
| `lib/overview/load-weekly-overview.ts` | Org-level capacity aggregates     |

### Level 2 sections and data availability

| Sub-section | Data available                               | Notes                                   |
| ----------- | -------------------------------------------- | --------------------------------------- |
| Overview    | ✅ `fact_capacity`, `fact_bench`             | KPI summary                             |
| Operations  | ✅ `fact_worklogs`, `fact_capacity`          | Current month operational usage         |
| Planning    | ✅ `fact_plans`                              | Planned allocations per person/project  |
| Forecast    | ❌ No predictive data                        | Requires derived trends or ML — phase 2 |
| Allocations | ✅ `fact_plans`, `dim_person`, `dim_project` | People-to-project mapping               |
| Bench       | ✅ `fact_bench`                              | Idle capacity analysis                  |
| Scenarios   | ❌ No simulation engine                      | Phase 2                                 |

### Implementation steps

- [ ] **SP-2.1** Create `/capacity` route shell and layout with Level 2 nav
- [ ] **SP-2.2** Capacity Overview sub-page: org-level KPIs (net capacity, utilization, bench rate, planned vs actual)
- [ ] **SP-2.3** Operations sub-page: current month breakdown by role (utilization, logged, billable, PTO)
- [ ] **SP-2.4** Planning sub-page: planned hours table by person/project for selected month
- [ ] **SP-2.5** Allocations sub-page: people-to-project allocation grid
- [ ] **SP-2.6** Bench sub-page: unallocated capacity by person and role
- [ ] **SP-2.7** Mark Forecast and Scenarios as coming soon (stub pages)

---

---

## SP-3 — People

> Answers: "Who is overloaded?"

### Current state — partial (mixed into `/team`)

The current `/team` route contains a mix of individual-level data and role-level data. When SP-0 splits the routes, the individual-level components migrate to `/people`.

**Components that map to People (`components/team/`):**

| Component                 | Maps to People sub-section             |
| ------------------------- | -------------------------------------- |
| `team-analytics-grid.tsx` | People → Utilization (individual rows) |
| `team-kpi-section.tsx`    | People → Utilization (KPI summary)     |
| `team-filter-select.tsx`  | People → Directory (filter/search)     |
| `team-toolbar.tsx`        | Reusable across People sub-pages       |

**Loaders that map to People (`lib/team/`):**

| File                                  | Maps to                           |
| ------------------------------------- | --------------------------------- |
| `load-team-month-kpis.ts`             | People → Utilization KPIs         |
| `load-team-role-analytics.ts`         | Shared: People + Teams            |
| `load-team-staffing-rows.ts`          | People → Utilization rows         |
| `resolve-filtered-person-ids.ts`      | People → Directory filters        |
| `load-team-filter-options.ts`         | People → Directory filter options |
| `sum-logged-hours-by-project-type.ts` | People → Utilization breakdown    |
| `team-utilization-tone.ts`            | People → Utilization visual state |

### Level 2 sections and data availability

| Sub-section   | Data available                                  | Notes                                       |
| ------------- | ----------------------------------------------- | ------------------------------------------- |
| Directory     | ✅ `dim_person`, `dim_role`                     | Searchable index                            |
| Utilization   | ✅ Existing team loaders                        | Substantial work already done               |
| Fragmentation | ✅ `fact_fragmentation`                         | High-value — not yet surfaced               |
| Availability  | ✅ `fact_bench`                                 | Future open capacity per person             |
| Performance   | 🟡 Derivable from `fact_worklogs`, `fact_plans` | Allocation consistency, utilization balance |
| Skills        | ❌ No skills data in schema                     | Phase 2                                     |

### Implementation steps

- [ ] **SP-3.1** Create `/people` route shell and layout with Level 2 nav
- [ ] **SP-3.2** Migrate individual-level components from `/team` to `/people/utilization`
- [ ] **SP-3.3** People → Directory sub-page (searchable list with role, team, seniority)
- [ ] **SP-3.4** People → Fragmentation sub-page — surface `fact_fragmentation` data per person (high value)
- [ ] **SP-3.5** People → Availability sub-page — bench data per person with upcoming PTO
- [ ] **SP-3.6** People → Performance sub-page (allocation consistency, utilization trend)
- [ ] **SP-3.7** Mark Skills as coming soon (no data source)

---

---

## SP-4 — Teams

> Answers: "Which teams are healthy?"

### Current state — partial (mixed into `/team`)

The current `/team` route also contains role/team-level aggregates. When SP-0 splits routes, these migrate to `/teams`.

**Components that map to Teams (`components/team/`):**

| Component                  | Maps to Teams sub-section |
| -------------------------- | ------------------------- |
| `team-staffing-grid.tsx`   | Teams → Staffing          |
| `team-analytics-block.tsx` | Teams → Utilization       |
| `team-kpi-block.tsx`       | Teams → Overview KPIs     |
| `team-header-block.tsx`    | Teams → shared header     |
| `team-static-header.tsx`   | Teams → shared header     |

**Loaders that map to Teams (`lib/team/`):**

| File                           | Maps to                                   |
| ------------------------------ | ----------------------------------------- |
| `load-project-scoped-hours.ts` | Teams → Staffing (project hours per team) |
| `load-team-role-analytics.ts`  | Teams → Utilization by role               |
| `team-month-role.ts`           | Teams → shared filter context             |
| `team-elapsed-pace-context.ts` | Teams → Utilization pace                  |

### Level 2 sections and data availability

| Sub-section     | Data available                          | Notes                                   |
| --------------- | --------------------------------------- | --------------------------------------- |
| Overview        | ✅ Existing loaders                     | KPI summary per team/role               |
| Composition     | ✅ `dim_person`, `dim_role`, `dim_zone` | Headcount, role mix                     |
| Utilization     | ✅ Existing loaders                     | Team-level capacity fill                |
| Staffing        | ✅ `fact_plans`, `dim_project`          | Existing staffing grid                  |
| Dependencies    | ❌ Complex derivation                   | Shared resources across teams — phase 2 |
| Skills Coverage | ❌ No data source                       | Phase 2                                 |
| Health          | 🟡 Derivable                            | Composite score from existing metrics   |

### Implementation steps

- [ ] **SP-4.1** Create `/teams` route shell and layout with Level 2 nav
- [ ] **SP-4.2** Migrate team-level components from `/team` to `/teams`
- [ ] **SP-4.3** Teams → Overview sub-page (KPI summary per role)
- [ ] **SP-4.4** Teams → Composition sub-page (headcount, role mix, seniority)
- [ ] **SP-4.5** Teams → Utilization sub-page (team-level workload charts, migrate from current `/team`)
- [ ] **SP-4.6** Teams → Staffing sub-page (migrate existing staffing grid)
- [ ] **SP-4.7** Teams → Health sub-page (composite scoring from existing metrics)
- [ ] **SP-4.8** Mark Dependencies and Skills Coverage as coming soon

---

---

## SP-5 — Projects

> Answers: "Which deliveries are at risk?"

### Current state — minimal

The existing `/pipeline` route (proto-Projects) contains a deal list for pre-sales capacity impact. It will be deactivated in SP-0. Projects is a net-new section.

**Data available for Projects:**

| Table                  | What it enables                                     |
| ---------------------- | --------------------------------------------------- |
| `dim_project`          | Project registry, types (build/support/internal)    |
| `fact_project_actuals` | Aggregate logged + billable hours per project/month |
| `fact_plans`           | Planned hours per person per project                |
| `fact_worklogs`        | Individual worklog entries per project              |

### Level 2 sections and data availability

| Sub-section  | Data available                           | Notes                                                  |
| ------------ | ---------------------------------------- | ------------------------------------------------------ |
| Portfolio    | ✅ `dim_project`, `fact_project_actuals` | Active projects, delivery status                       |
| Health       | 🟡 Derivable                             | Risk scoring from staffing, burn, allocation stability |
| Staffing     | ✅ `fact_plans`, `dim_person`            | People assigned per project                            |
| Delivery     | ❌ Jira ticket data not in schema        | Throughput, velocity — partial or future               |
| Financials   | ❌ No budget data in schema              | Phase 2                                                |
| Dependencies | ❌ Complex derivation                    | Phase 2                                                |

**Future: Pipeline integration (Zoho CRM)**

- Pre-sales pipeline data lives in Zoho, outside the Jira/Supabase stack.
- When integrated, Pipeline becomes a Projects sub-section (or standalone Level 1 domain).
- Requires a Zoho → Supabase sync path. Not in scope for Phase 1.

### Implementation steps

- [ ] **SP-5.1** Create `/projects` route shell and layout with Level 2 nav
- [ ] **SP-5.2** Projects → Portfolio sub-page (project list with type, status, staffing load)
- [ ] **SP-5.3** Projects → Staffing sub-page (people assigned per project, allocation %)
- [ ] **SP-5.4** Projects → Health sub-page (risk indicators per project)
- [ ] **SP-5.5** Mark Delivery, Financials, Dependencies as coming soon
- [ ] **SP-5.6** Document Zoho integration path for future Pipeline sub-section

---

---

## SP-6 — Insights `[phase 2]`

> Answers: "What requires intervention today?"

### Current state

The `/flags` route is the proto-implementation. It surfaces risk flags with severity and age. It is deactivated in SP-0 but preserved as the foundation for Insights.

### Scope (phase 2)

- Anomaly detection (utilization spikes, sudden bench growth, fragmentation increase)
- AI-generated recommendations from the Claude agent (surfaced passively, not via chat)
- Trend-based alerts (month-over-month degradation signals)
- Burnout risk indicators (sustained overutilization per person)
- Staffing opportunity signals (bench + incoming pipeline)

### Prerequisites

All of SP-1 through SP-5 must be stable before Insights can aggregate across them.

---

---

## SP-7 — Reports `[phase 2]`

> Answers: "What does the trend look like historically?"

### Current state

Not implemented. No routes, no components, no loaders.

### Scope (phase 2)

- Monthly operational review exports (PDF / structured data)
- Year-over-year trend comparisons
- Historical snapshot browsing (`sync_snapshot` time axis)
- Executive summary generation

### Prerequisites

Stable historical data in Supabase v2 (at least 6 months of `sync_snapshot` history).

---

---

## Current codebase mapping

Summary of what exists today and where it lands in the target architecture.

### Routes

| Current route | Status              | Target                                |
| ------------- | ------------------- | ------------------------------------- |
| `/`           | Active, substantial | SP-1 Overview (keep, extend)          |
| `/team`       | Active, partial     | SP-3 People + SP-4 Teams (split)      |
| `/flags`      | Active, minimal     | Deactivate → SP-6 Insights foundation |
| `/pipeline`   | Active, minimal     | Deactivate → SP-5 Projects future     |
| `/ask`        | Active              | Keep as transversal utility           |

### Components

| Folder                  | Current route | Target                          |
| ----------------------- | ------------- | ------------------------------- |
| `components/overview/`  | `/`           | SP-1 Overview (keep)            |
| `components/team/`      | `/team`       | Split: SP-3 People + SP-4 Teams |
| `components/layout/`    | All routes    | Keep, extend with section-nav   |
| `components/dashboard/` | Shared        | Keep as shared primitives       |
| `components/ui/`        | Shared        | Keep                            |

### Lib / loaders

| Folder          | Current use           | Target                          |
| --------------- | --------------------- | ------------------------------- |
| `lib/overview/` | Overview page         | SP-1 (keep)                     |
| `lib/team/`     | Team page             | Split: SP-3 People + SP-4 Teams |
| `lib/domain/`   | Shared formulas       | All SPs (keep, extend)          |
| `lib/data/`     | Shared data utilities | All SPs (keep, extend)          |
| `lib/format/`   | Display formatting    | All SPs (keep)                  |
| `lib/supabase/` | DB clients            | All SPs (keep)                  |

---

## Implementation sequence (recommended)

```
SP-0  Navigation architecture
  └── SP-1  Overview (extend existing, lowest cost)
  └── SP-3  People (migrate existing team components)
  └── SP-4  Teams (migrate existing team components)
  └── SP-2  Capacity (new, highest data coverage)
  └── SP-5  Projects (new, partial data)
        └── SP-6  Insights [phase 2]
        └── SP-7  Reports [phase 2]
```

SP-0 is the hard dependency for everything. After SP-0, SP-1, SP-3, and SP-4 can proceed in parallel because most of their components already exist — they primarily need migration and route restructuring. SP-2 and SP-5 require new loaders and components.
