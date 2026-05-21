# Workforce Intelligence

Engineering Operations Intelligence Platform.

---

## Platform vision

Every section answers ONE question leadership actually asks:

| Section  | Core question                 | Phase |
| -------- | ----------------------------- | ----- |
| Overview | How healthy is the org?       | 1     |
| Capacity | Can we absorb work?           | 1     |
| People   | Who is overloaded?            | 1     |
| Teams    | Which teams are healthy?      | 1     |
| Projects | Which deliveries are at risk? | 1     |

This framing prevents dashboard soup. Each section owns exactly one domain of responsibility.

---

## Navigation structure (2 levels)

### LEVEL 1 — PRIMARY NAVIGATION

The sidebar. Defines: "which domain am I exploring?"

#### 1. Overview

Executive landing.

- **Purpose:** Global org health at a glance.
- **Audience:** Leadership, directors, PMO, engineering management.
- **Role access:** admin, leadership.
- **Includes:** org health, utilization, delivery risk, staffing pressure, top alerts, trends, project portfolio health.

#### 2. Capacity

The operational core.

- **Purpose:** Understand how capacity is distributed and consumed.
- **Audience:** Engineering management, PMO.
- **Role access:** admin, leadership.
- **Includes:** utilization, planning, forecast, allocations, bench, PTO impact, saturation, hiring gaps.

#### 3. People

Individual-centered view.

- **Purpose:** Analyze individual workload and operational load.
- **Audience:** Engineering management, team leads.
- **Role access:** admin (full detail), leadership (aggregate).
- **Includes:** utilization per person, project fragmentation, seniority, skills, PTO, performance indicators, workload distribution, cross-team allocation.
- **Distinction from Teams:** People starts bottom-up — from a person's perspective. Teams starts top-down — from an org structure perspective.

#### 4. Teams

Organizational view.

- **Purpose:** Understand team structures and dynamics.
- **Audience:** Engineering management, PMO.
- **Role access:** admin, leadership.
- **Includes:** team composition, delivery load, capacity health, leadership structure, role distribution, staffing balance, inter-team dependencies.
- **Distinction from People:** Teams starts top-down — from an organizational structure. People starts bottom-up — from an individual's workload.

#### 5. Projects

Delivery intelligence.

- **Purpose:** Understand the operational state of active projects.
- **Audience:** Account managers, engineering management, PMO.
- **Role access:** admin, leadership, account_manager (filtered by assigned projects).
- **Includes:** staffing, burn, budget, delivery risk, allocation, velocity, project health score, dependency mapping.
- **Future:** This eventually becomes Portfolio Management, incorporating the pipeline view (pre-sales data from Zoho CRM — see note below).

---

### LEVEL 2 — SIDEBAR DRILL-IN (Vercel-style)

**Level 1:** Compact root list (Overview, Capacity, People, Teams, Projects) with chevrons on domains that have sub-routes. **Level 2:** When inside a domain (`/capacity/*`, etc.), the sidebar switches to a drill-in panel: back control + section title + sub-route list (each item shows its description as a subtitle). **Search:** `⌘K` / sidebar trigger (top of left nav, below brand) — indexes title, description, and breadcrumb from `lib/navigation/navigation-catalog.ts`. Brand + search stay visible in level-2 drill-in. Config: `navigation-catalog.ts`, `section-nav-config.ts`, `sidebar-nav-config.ts`, UI: `sidebar.tsx`, `navigation-command-menu.tsx`.

#### Capacity

- **Overview:** High-level KPIs + summary.
- **Operations:** Current month operational usage. Includes: utilization, logged, billable, PTO, operational saturation.
- **Planning:** Future planned allocations. Includes: planned utilization, role allocation, future staffing, monthly planning.
- **Forecast:** Predictive capacity trends. Includes: future utilization, delivery pressure, saturation forecasting, hiring projections.
- **Allocations:** Detailed people/project allocations. Includes: people-to-project mapping, allocation %, split allocations, staffing load.
- **Bench:** Unallocated/open capacity analysis. Includes: idle capacity, future availability, underutilized teams, staffing opportunities.
- **Scenarios:** `[future]` What-if simulations. Includes: hiring simulations, project expansion impact, PTO stress testing, staffing redistribution.

#### People

- **Directory:** Searchable people index. Includes: roles, teams, seniority, regions, project participation.
- **Utilization:** Individual workload analysis. Includes: capacity fill, logged hours, billable %, operational load, overtime indicators.
- **Fragmentation:** One of the most valuable future sections. Analyzes: too many projects per person, context switching, split allocations, organizational inefficiency.
- **Availability:** Future open capacity. Includes: future open capacity, upcoming PTO, allocation gaps, staffing readiness.
- **Performance:** Operational delivery metrics — NOT HR performance. Includes: allocation consistency, delivery participation, utilization balance, workload stability.
- **Skills:** `[future — no data source yet]` Skill inventory and capability map.

#### Teams

- **Overview:** Team-level operational summary. Includes: utilization, staffing balance, team health, delivery pressure.
- **Composition:** Organizational structure visualization. Includes: headcount, roles, seniority mix, geographic distribution, skill composition.
- **Utilization:** Team workload and efficiency analysis. Includes: capacity fill, billable %, logged trends, PTO impact, saturation analysis.
- **Staffing:** Resource allocation by team. Includes: project allocations, staffing distribution, cross-team participation, allocation balance.
- **Dependencies:** Inter-team operational relationships. Includes: shared resources, delivery dependencies, leadership overlap, collaboration patterns.
- **Skills Coverage:** `[future — no data source yet]` Capability strength by team. Includes: technology concentration, specialization gaps, redundancy analysis, critical skill risk.
- **Health:** Composite operational health scoring. Includes: overload risk, fragmentation, PTO pressure, staffing stability, delivery consistency.

#### Projects

- **Portfolio:** High-level portfolio overview. Includes: active projects, delivery status, staffing distribution, portfolio load.
- **Health:** Project operational health scoring. Includes: delivery risk, staffing pressure, PTO impact, utilization imbalance, allocation instability.
- **Staffing:** Project staffing analysis. Includes: assigned people, allocation %, staffing gaps, cross-team staffing.
- **Delivery:** `[partial — depends on Jira ticket data depth]` Execution and delivery metrics. Includes: throughput, ticket progress, delivery consistency, operational velocity, blocker analysis.
- **Financials:** `[future — no budget data in schema]` Operational financial visibility. Includes: billable utilization, burn tracking, budget consumption, staffing cost efficiency.
- **Dependencies:** Project relationship mapping. Includes: shared teams, staffing conflicts, delivery dependencies, operational bottlenecks.

---

## Transversal utility: Ask

The `/ask` route exposes the Claude-powered agent interface. It is NOT part of the 7 navigation domains. It is a transversal utility available to all roles.

- Lives at the bottom of the sidebar, visually separated from the main nav.
- Does not follow the Level 2 pattern — it is a single full-page interface.
- Audience: all roles (response is scoped to the user's role context).

---

## Future integration: Pipeline (Zoho CRM)

Pipeline data (deals, pre-sales capacity impact) lives in Zoho CRM, outside the Jira/Supabase stack.

- **Not in scope for Phase 1.**
- When integrated, Pipeline becomes a sub-section of Projects (or a standalone Level 1 domain depending on scope).
- Data ingestion would require a Zoho → Supabase sync path, similar to the existing Jira → Supabase v2 ingestion.
- Documented here for planning continuity.

---

## UX principle — avoid dashboard soup

A flat sidebar with 10+ items (Overview, Team, Capacity, Planning, Utilization, Reports, Analytics…) degrades rapidly. The 2-level hierarchy keeps primary nav at 5 active sections for Phase 1, each with a clear domain and a single question it answers.

The test: if you can't explain in one sentence what a section is for and who reads it, it does not belong at Level 1.
