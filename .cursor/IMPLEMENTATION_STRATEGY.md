# capacity-dashboard — implementation strategy

This document turns `CLAUDE.md` into an ordered plan. It is split into two stages: **refactor in place** first, then **feature-complete each route** with v2 data, UI, and contracts.

**Authoritative rules:** `CLAUDE.md` (D-009, D-018, D-019), `capacity/doc/CONTRACTS.md` (C-003, C-004, C-005), `capacity/doc/DECISIONS.md`.

---

## Guiding principles (do not skip)

- **v2 tables only** for new or migrated code. Do not add queries against v1 snapshot tables.
- **Latest snapshot:** resolve `snapshot_id` from `sync_snapshot` (`created_at DESC`, limit 1) before joining snapshot fact tables. Never hard-code a snapshot ID.
- **Non-snapshot facts:** `fact_worklogs` has no `snapshot_id`; use for billable and logged totals by date.
- **Secrets:** service role and Anthropic key stay server-only; no client calls to external APIs.
- **Roles:** `admin`, `leadership`, `account_manager` — scoping is mandatory for `account_manager` (queries + future agent context).

---

# Stage 1 — Fix and refactor in place

Goal: align the existing shell and data access with the architecture before building full features. No new product surfaces are required to complete this stage, but the codebase must be ready to support them.

## 1.1 Types and schema alignment

| Action | Rationale |
|--------|-----------|
| Regenerate `lib/supabase/database.types.ts` from the real Supabase project (`pnpm db:types` with correct project id). | Current typings mix v1 tables and outdated `dim_*` shapes (e.g. `dim_person` vs `role_id` / `zone_id` in C-003). |
| After regeneration, use types for all new queries; delete dead v1 types only when no code path references them. | Keeps a single source of truth with the live schema. |

## 1.2 Data layer: retire v1 from the overview

| Action | Rationale |
|--------|-----------|
| Replace `worklogs_snapshot` usage in `lib/overview/load-weekly-overview.ts` with **`fact_worklogs`** (+ joins as needed: `dim_person`, `dim_date` if useful). | D-019; current overview violates the v2-only rule. |
| Redefine "as of" for worklog-based views: align with product (e.g. last sync in `sync_snapshot` or business rule) instead of v1 `snapshot_date` on worklogs. | v2 worklogs are not per-sync snapshots. |

## 1.3 Sync status: single source of truth

| Action | Rationale |
|--------|-----------|
| Reconcile `components/layout/sync-status.tsx` with the documented model: prefer **`sync_snapshot`** (or the table that ingestion actually updates). If `sync_log` is legacy, migrate reads and then remove the duplicate concept. | Avoid two conflicting "last sync" stories in the UI. |

## 1.4 Utilization domain (C-005)

| Action | Rationale |
|--------|-----------|
| Keep `lib/domain/utilization.ts` as the single place for the formula; **update comments and inputs** to reference v2: `fact_capacity` (net capacity / targets), working days from zone + `dim_holiday` + `dim_date` as required by the capacity contract. | Comments still point at v1 `capacity_baseline`. |
| Add small, testable helpers for "days elapsed" and "total working days" in the month for a given person or roll-up, reusing one calendar implementation (see `lib/overview/working-days.ts` or merge there). | C-005 must match `capacity/SKILL.md` exactly. |

## 1.5 Middleware and auth (verify, minimal change)

| Action | Rationale |
|--------|-----------|
| Confirm `proxy.ts` (Next 16 "Proxy" middleware) runs on all protected routes; keep `/login` and `/auth` excluded. | Session refresh and redirect must stay correct as routes grow. |
| Optional hardening: add a server-side guard in a shared layout or route group if middleware behavior changes in a future Next release. | Defense in depth (document if added). |

## 1.6 Dependencies vs documentation

| Action | Rationale |
|--------|-----------|
| Add **Recharts** (or shadcn chart wrappers) when the first chart ships, or document "charts TBD" in this file only — avoid a permanent gap between `CLAUDE.md` stack list and `package.json`. | TanStack Table is present; Recharts is named in the project instructions but not yet a dependency. |

## 1.7 Documentation hygiene (optional)

| Action | Rationale |
|--------|-----------|
| Update `README.md` when Stage 1 is done: replace "placeholder" status with a short "in development" and link to this strategy. | Reduces confusion for contributors; not required for functionality. |

**Stage 1 exit criteria:** Overview loads from **v2**; sync indicator reads from the **agreed** sync table; types reflect **v2**; utilization helpers are **C-005-ready** with v2 field names; no new code depends on v1 snapshot tables.

**Stage 1 completed (in-repo):** Overview uses v2 with paged reads. **`/` weekly cards** (`load-weekly-overview.ts`, `prorate-to-weeks.ts`, `weekly-headline-section`): net capacity, planned (excluding `fact_plans.is_pto`), availability from `fact_bench`, PTO and billable/logged from `fact_worklogs` — snapshot facts at latest `sync_snapshot` + `month_date` prorated to ISO weeks by **Mon–Fri**; worklogs capped by `min(month end, sync day, today)`. Details: `CLAUDE.md` section *Overview page (`/`) — weekly metrics*. `SyncStatus` uses `sync_snapshot.created_at`; `getLatestSyncSnapshot` in `lib/data/latest-sync-snapshot.ts`; C-005 comments and `working-days` helpers; dashboard layout server auth guard. Recharts: still Stage 2. Regenerate `database.types` with `pnpm db:types` when the schema drifts.

---

# Stage 2 — Build each section end-to-end

Each subsection follows the same pattern: **purpose → UI (sections and components) → v2 data → queries / KPIs → notes (roles, performance).**

Shared building blocks to introduce early in Stage 2 (used across routes):

- **`getLatestSnapshotId()`** — `sync_snapshot` ordered by `created_at` desc, limit 1; returns `id` and metadata for "as of" labels.
- **Query modules** under `lib/queries/` or `lib/data/` (one file per domain: `worklogs`, `bench`, `capacity`, `fragmentation`, `project-actuals`, `plans`) to keep server components thin.
- **Role gate** — small helper: `getViewerRole()` from session; for `account_manager`, apply **project allowlist** or org rule from app metadata (define with product when pipeline ships).

---

## 2.1 Route: `/` — Utilization overview

**Purpose (CLAUDE.md):** Leadership and EM: **8-week trend**, **bench rate**, headline utilization (C-005) — still largely **Stage 2** on this page.

### Implemented: weekly cards

**Components:** `WeeklyHeadlineSection`, `loadWeeklyOverview` in `load-weekly-overview.ts`, `prorate-to-weeks.ts`.

| UI row | v2 data | Week-level rule |
|--------|---------|-----------------|
| Net capacity | `fact_capacity` | Org sum of `net_capacity_hours` (by person, + across `source`), prorated Mon–Fri. |
| Planned | `fact_plans` | `is_pto = false` only, sum `planned_hours`, same proration. |
| Availability | `fact_bench` | Sum `availability_hours`, same proration. |
| PTO | `fact_worklogs` | `is_pto` rows, `logged_seconds` → hours by ISO week, worklog date cap. |
| Billable / Logged | `fact_worklogs` | Non-PTO, seconds → hours, same week buckets. |

**Authoritative spec:** `CLAUDE.md` — *Overview page (`/`) — weekly metrics (implementation contract)*. Proration is calendar **Mon–Fri** only; holiday-aware split is a future change.

### Still to build on `/` (per original plan)

| Section | Notes |
|---------|--------|
| 8-week trend | Recharts (or shadcn charts) — not yet a dependency. |
| Bench / utilization headline KPIs | e.g. bench rate, C-005 utilization — add when product defines roll-up. |
| Optional | Month selector, `account_manager` scoping. |

**Account manager:** When aggregating, filter people/projects in scope; confirm with D-018 / product.

---

## 2.2 Route: `/team` — Individual utilization

**Purpose:** Per-person view; role breakdown; table-first UX.

**UI**

| Section | Components |
|---------|------------|
| Toolbar | Month picker, role filter, search (name) — can use `nuqs` for URL state |
| Main grid | TanStack Table: person, role, billable hours, target, utilization (C-005), optional trend mini-cell |
| Summary row or footer | Weighted or simple averages (document aggregation rules) |

**v2 tables**

- **`fact_worklogs`:** sum billable (and logged) by `person_id` and month (or date range).
- **`fact_capacity`:** `net_capacity_hours` per person, month, **latest** `snapshot_id`.
- **`dim_person`**, **`dim_role`:** labels and filters.
- **`dim_date`:** month boundaries and working day counts for C-005.

**KPIs per row**

- Billable hours (period).
- `monthly_target` from `fact_capacity` (watch `source` if multiple rows per person-month).
- **Utilization (C-005)** using shared domain helper + working days.

**Queries**

- One query for worklog aggregates; one for capacity for the same `person_id` + `month_date` set; join in app or via SQL view later if needed.

**Performance:** Paginate or virtualize if person count is large; index assumptions live in `capacity-mcp` migrations, not this repo.

---

## 2.3 Route: `/flags` — Risk flags

**Purpose:** Open risks: severity, age, project/person link.

**UI**

| Section | Components |
|---------|------------|
| List or table | Severity badge, title/summary, age (days), link to project/person (if in data) |
| Filters | Severity, project, "open only" |

**v2 tables (depends on product definition of "flag")**

- If flags are **ingested as facts:** likely a dedicated table or `fact_fragmentation` / metadata — **confirm in C-003** after schema review. `fact_fragmentation` holds pre-computed fragmentation flags; risk tickets might live in another v2 table when available.
- **`dim_project`:** project names/keys.
- **`dim_person`:** owner or assignee if modeled.

**KPIs**

- Count of open flags by severity; oldest open age; optional trend of new vs closed (if history exists).

**Note:** If v2 has no "risk flag" table yet, this section is **blocked** on `capacity-mcp` schema; document the dependency and use a read-only empty state until the table exists.

---

## 2.4 Route: `/pipeline` — Deals and capacity impact

**Purpose:** Deal list with **capacity impact estimate** (Zoho / CRM linkage may be in ingestion, not the dashboard).

**UI**

| Section | Components |
|---------|------------|
| Table | Deal name, stage, value or LOE, estimated hours, capacity impact, owner |
| Detail drawer (optional) | Deeper staffing read from `fact_plans` / `dim_project` |

**v2 tables**

- Pipeline rows may map to **`dim_project`** (type, `loe_estimate_hours`) and **`fact_plans`** for monthly planned hours at **latest** `snapshot_id`.
- **`fact_project_actuals`:** cross-check logged vs plan for "impact" stories.

**KPIs**

- Total pipeline LOE; sum of planned hours in horizon; % of available capacity (from `fact_capacity` roll-up).

**Account manager:** Strong candidate for **strict filtering** to assigned accounts/projects.

---

## 2.5 Route: `/ask` + API — Agent query (C-004)

**Purpose:** User sends a message; server returns a text response; **no** agent logic in the client beyond transport.

**UI**

- Chat-style layout: input, send, message list, loading/error states, optional "role" display (read-only, from session — do not let the client set `userRole` without verifying server-side).

**API**

- **`POST /api/chat`** with body per C-004: `{ "message": string, "userRole": "admin" | "leadership" | "account_manager" }` — **recommend deriving `userRole` from the session** on the server and ignoring or validating client value.
- On each success (and optionally on failure, per product): insert **`audit_log`** in Supabase (server-only, service client).
- Call Claude (or your orchestration) with the **same** data boundaries as the user role (especially `account_manager`).

**Security**

- `ANTHROPIC_API_KEY` only in environment; no browser exposure.
- 401 if no session.

---

## 2.6 Cross-cutting: role-based scoping

**Implementation strategy**

- Centralize **`getServerSession` + `role` + `account_manager` project scope** (if stored in `app_metadata` or a join table — define with backend).
- Every server loader that runs **aggregates** for `account_manager` must filter: `project_id` / `person_id` in scope.
- **`/api/chat`:** pass scoped context to the model (summaries or tool hints), not full warehouse access.

---

## 2.7 Testing and quality (lightweight, as features land)

- Unit tests for **C-005** and working-day edge cases (month boundaries, zones when multi-zone roll-ups exist).
- Smoke test: authenticated request to `/api/chat` returns 200 and creates `audit_log` row (integration test or manual checklist in development).

---

## Suggested order within Stage 2

1. Shared **`getLatestSnapshotId`** + query modules + regenerate types (if not already done in Stage 1).
2. **`/`** overview (highest visibility; validates worklogs + bench + charts).
3. **`/team`** (table + TanStack + C-005 wiring).
4. **`/api/chat` + `/ask`** (C-004 + audit + security).
5. **`/pipeline`** and **`/flags`** (depend most on v2 business tables and product definitions).

This order maximizes reuse of the same v2 query patterns and reduces throwaway UI.

---

*Last updated: implementation planning document for capacity-dashboard. Revise as C-003 schema and product scope evolve.*
