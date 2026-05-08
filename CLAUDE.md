# capacity-dashboard — Project Instructions

## What this repo is

Passive consumption interface for leadership and account management.
Not a replacement for the agent — the agent remains the power-user tool.

**Audience:**
- Leadership: aggregate utilization, bench rate, trend charts
- Account managers: project-level staffing view, SLA flags
- EM: quick read-only access when not at Claude Code workstation

**This repo does NOT own:**
- Agent skills or CLAUDE.md logic (those live in [capacity](../capacity/CLAUDE.md))
- MCP servers (those live in [capacity-mcp](../capacity-mcp/CLAUDE.md))
- Supabase schema migrations (those live in [capacity-mcp](../capacity-mcp/doc/SCHEMA_V2_PLAN.md))
- Any write path to the database (all writes come from [capacity-mcp](../capacity-mcp/CLAUDE.md) ingestion script)

## Tech stack

Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, Recharts.
Supabase Auth with Google OAuth for authentication (`@supabase/ssr`). Supabase (service role, server-side only) for all data reads.
Deployed on Vercel.

## Data store

**Single data store: Supabase.** The dashboard is a pure read-only Supabase consumer.

There is no SQLite cache, no sync orchestrator, no local database. All views read
directly from Supabase tables populated by the `capacity-mcp` ingestion script.

This is a firm architectural decision (D-009). Do not reintroduce SQLite or a local cache.

### Schema version

The dashboard targets **v2 tables exclusively** (D-019). v1 snapshot tables (`worklogs_snapshot`,
`plans_snapshot`, `project_actuals_snapshot`, `capacity_baseline`, `fragmentation_snapshot`) are
consumed only by the MCP agent during the transition period and will be dropped when v2 is validated.

Do not write new dashboard queries against v1 tables.

### v2 table inventory (read-only)

#### Dimension tables

| Table | Purpose |
|---|---|
| `dim_person` | Team members; carries `role_id FK → dim_role`, `zone_id FK → dim_zone` |
| `dim_project` | Project registry with type (`build`, `support`, `internal`) |
| `dim_role` | Controlled role vocabulary: `(id, key, label)` — keys: `fsd`, `fed`, `qa`, `pm`, `tl`, `ux`, `em` |
| `dim_zone` | Holiday zones: `(id, key, label)` |
| `dim_holiday` | Company-observed holidays with `zone_id FK → dim_zone` |
| `dim_date` | Date spine for calendar joins |

#### Sync anchor

| Table | Purpose |
|---|---|
| `sync_snapshot` | One row per sync run (GitHub Actions or manual trigger). FK anchor for all snapshot fact tables. Use the latest `snapshot_id` per `(person_id, month_date)` for current-state views. |

#### Fact tables

| Table | Model | Unique key | Notes |
|---|---|---|---|
| `fact_worklogs` | Upsert (no `snapshot_id`) | `(person_id, project_id, log_date)` | Individual worklog entries; stable once logged. Use for billable hour totals. |
| `fact_plans` | Snapshot per sync | `(snapshot_id, person_id, project_id, month_date)` | Planned hours per person per project per month |
| `fact_capacity` | Snapshot per sync | `(snapshot_id, person_id, month_date, source)` | Zone-adjusted net capacity |
| `fact_project_actuals` | Snapshot per sync | `(snapshot_id, project_id, month_date)` | Aggregate logged + billable hours per project |
| `fact_fragmentation` | Snapshot per sync | `(snapshot_id, person_id, month_date, source)` | Pre-computed fragmentation flags |
| `fact_bench` | Pre-computed per sync | `(snapshot_id, person_id, month_date)` | `availability_hours` is a generated column (`net_capacity_hours - planned_hours`) |

Write access: `audit_log` only (one row per `/api/chat` call).

### Query patterns by view

| View | Primary tables | Filter axes |
|---|---|---|
| Utilization by role/month | `fact_worklogs`, `fact_capacity`, `dim_person`, `dim_role`, `dim_date` | year, month, role, person |
| Net capacity available | `fact_capacity` (latest `snapshot_id`) | role, month, source |
| Project status | `fact_project_actuals`, `dim_project` | type, name, status, month |
| Bench grid | `fact_bench` (latest `snapshot_id`) | role, month |
| Fragmentation | `fact_fragmentation`, `fact_plans`, `dim_person`, `dim_project` | role, month, source |
| Same-period YoY | any fact table | `month_date` range spanning multiple years |
| Utilization trend (intra-month) | `fact_project_actuals` filtered by `snapshot_id` | project, month |
| Overview (weekly cards on `/`) | `sync_snapshot`, `fact_capacity`, `fact_plans`, `fact_bench`, `fact_worklogs` | `month_date`, `snapshot_id`, worklog `log_date` (see *Overview page (`/`) — weekly metrics*) |

**Latest snapshot pattern:** For current-state views, always resolve the latest `snapshot_id` from
`sync_snapshot` first (ordered by `created_at DESC`, limit 1), then join fact tables on that ID.
Never hard-code a snapshot ID.

### Overview page (`/`) — weekly metrics (implementation contract)

**Code:** `lib/overview/load-weekly-overview.ts`, `lib/overview/prorate-to-weeks.ts`, `components/overview/weekly-headline-section.tsx`.

The overview shows one card per **ISO week** (Monday start) that overlaps the **reference month**. Each card lists, in order:

| Row | Data source | Rules |
|-----|-------------|--------|
| Net capacity | `fact_capacity` | Latest `sync_snapshot` row; filter `month_date` to the month; sum `net_capacity_hours` by `person_id` (add across `source` if multiple rows per person). **Prorate** the org total to the week: Mon–Fri count in (week `∩` month) / Mon–Fri count in full month. |
| Planned | `fact_plans` | Same `snapshot_id` and `month_date`. **Exclude** PTO plan lines: `is_pto = false`. Sum `planned_hours` org-wide, same proration as net capacity. |
| Availability (bench) | `fact_bench` | Same `snapshot_id` and `month_date`. Sum `availability_hours` (treat null as 0), same proration. Cross-checks month-level `net - planned` from ingestion. |
| PTO | `fact_worklogs` | Rows with `is_pto = true`: sum `logged_seconds` to hours, bucket by `log_date` to the same ISO week. **Upper bound:** calendar **end** of reference month — not the MTD worklog cap (so future-dated PTO rows in `fact_worklogs` count toward their week). Rows still require ingestion. |
| Billable / Logged | `fact_worklogs` | Non-`is_pto` rows: `billable_seconds` / `logged_seconds` to hours. Uses the MTD/sync worklog date cap below. |

**Weekly detail table — Utilization (derived row):** Org-level **billable utilization vs prorated net capacity** for each ISO week and for the MTD totals column.

| Scope | Formula |
|---|---|
| Per week | `(billable_hours_week / net_capacity_hours_week) * 100`. Values rounded to one decimal for display. When billable or net capacity for that cell is zero or negative, the UI shows an em dash (consistent with zero billable hours as empty). |
| MTD total column | `(sum of billable_hours across weeks shown) / (sum of net_capacity_hours across those weeks) * 100` — ratio of **summed** hours, not the average of weekly percentages. |

Relationship to **C-005**: same billable-vs-capacity ratio as `fullMonthUtilization` when the denominator is the **portion of the month’s net capacity attributed to that week** (Mon–Fri overlap weights), not the full-month denominator used in `timeAdjustedUtilization`. Implementation: `overviewWeeklyBillableUtilizationPct` in `lib/overview/overview-metrics.ts`.

This is **not** the **Utilization (MTD)** donut on the same page, which is the mean of per-person `(logged_hours / elapsed_weekdays / 8) * 100` with elapsed weekdays adjusted for PTO (`loadWeeklyOverview` → `mtdUtilizationAvgPct`).

**Worklog `log_date` cap (billable + logged only):** `min(calendar end of month, start-of-day of last sync `sync_snapshot.created_at`, start of today)` so MTD and sync freshness stay consistent. Snapshot facts are **full-month** v2 values; they are not clipped to that day cap. **PTO** worklogs use the calendar-month end bound only (no today/sync clamp).

**Proration note:** The split uses **calendar** Mon–Fri only (see `prorate-to-weeks.ts`). It does not yet use per-zone `dim_holiday` or `net_working_days` from `fact_capacity` to split within the month. If that alignment is required, change the weight function and update this section.

## Authentication

Supabase Auth with Google OAuth (Mira Commerce Google Workspace). See D-018.
Authentication is handled via `@supabase/ssr`. No Clerk — Clerk was evaluated and rejected (D-018).

Two clients:
- `createAuthClient` — anon key, session reads
- `createServiceClient` — service role key, all data reads (server-side only)

Roles are stored in `auth.users.raw_app_meta_data` as `{ "role": "admin" | "leadership" | "account_manager" }`.
Use `app_metadata` (not `user_metadata`) — it is immutable by the authenticated user.

| Role | Access |
|---|---|
| `admin` | All data — EM |
| `leadership` | All aggregate views |
| `account_manager` | Project-level only (filtered context) |

All routes require authentication. No public pages. Session is validated via `@supabase/ssr` middleware.

## Core views (Phase 3)

| Route | Content |
|---|---|
| `/` | Utilization overview: weekly cards (net capacity, planned, availability, PTO, billable, logged) — see *Overview page (`/`) — weekly metrics*; 8-week trend, headline bench/utilization TBD |
| `/team` | Individual utilization table, role breakdown |
| `/flags` | Open risk flags, severity, age |
| `/pipeline` | Deal list with capacity impact estimate |
| `/ask` | Agent query interface (calls `/api/chat`, returns agent response) |

## Frontend design system

### Required skills — invoke before any UI work

Before writing or modifying any component, layout, or styling, invoke these three skills in order:

1. `/frontend-design` — commits to the aesthetic direction and guards against generic output
2. `/next-best-practices` — enforces RSC boundaries, async patterns, and file conventions
3. `/next-cache-components` — determines which server components get `'use cache'` and at what profile

Do not skip these even for small changes. They are the source of truth for how this UI is built.

### Established aesthetic direction

**Refined utilitarian dark-first.** Vercel-adjacent: monochromatic, high-contrast, data-legible.

- **Font:** Inter for UI sans text; JetBrains Mono for monospace (both via `next/font/google`). Do not add a second display font beyond this pairing.
- **Color space:** oklch throughout. All palette changes go in `app/globals.css` CSS custom properties only — never inline color values in components.
- **Dark mode:** default. The `<html>` element carries the `dark` class at root layout level.
- **Accent:** neutral (white-ish on dark, charcoal on light). No colored accents unless a specific data status demands it (e.g. `--destructive` for risk flags).
- **Borders:** hairline only — `oklch(1 0 0 / 8%)` on dark, `oklch(0.88 0 0)` on light. No heavy dividers.
- **Spacing:** generous negative space in content areas; tight, precise spacing within components.
- **Motion:** CSS transitions only (`transition-[width]`, `transition-colors`, `duration-150–200ms`). No Motion library unless a specific interaction cannot be done in CSS.

### Design constraints — what not to do

- Do not use Geist, Roboto, Space Grotesk, or any font other than Inter / JetBrains Mono for this app
- Do not use purple gradients, colorful card backgrounds, or bright accent palettes
- Do not inline color values — all colors come from CSS custom property tokens
- Do not add decorative illustrations, icons-as-art, or background textures unless explicitly requested
- Do not introduce new animation libraries (Framer Motion, Motion) for simple transitions
- Do not break the monochromatic palette for non-semantic reasons

### Sidebar collapse/expand pattern

The sidebar uses a CSS-variable-driven width transition. State is managed in a React context.

- `components/layout/sidebar-context.tsx` — `SidebarProvider` (`'use client'`) + `useSidebar()` hook; persists to `localStorage`
- `components/layout/sidebar.tsx` — reads `useSidebar()`; width driven by `--sidebar-w` / `--sidebar-w-collapsed` vars; labels fade out when collapsed; toggle button lives at sidebar bottom
- `app/(dashboard)/layout.tsx` — wraps children in `SidebarProvider`; provider is the only client boundary in the layout shell
- CSS vars: `--sidebar-w: 220px`, `--sidebar-w-collapsed: 52px`, transition `180ms cubic-bezier(0.4,0,0.2,1)`

The `Header` and all page content remain Server Components — they are passed as `{children}` props through the client provider, not rendered inside it.

### RSC and caching conventions

Enable PPR in `next.config.ts`:
```ts
const nextConfig = { cacheComponents: true }
```

| Component type | Directive | Profile |
|---|---|---|
| Auth session checks (layout, header) | none — must be fresh | — |
| Sync status, last-run metadata | `'use cache'` | `cacheLife('minutes')` |
| Aggregate data (capacity, bench, plans) | `'use cache'` | `cacheLife({ stale: 120, revalidate: 300 })` |
| Per-user or session-scoped data | extract outside cache, pass as arg | — |

Never put `cookies()` or `headers()` inside a `'use cache'` function. Extract at the Server Component level and pass as props.

### Component authoring rules

- All styling via Tailwind utility classes + `cn()` (clsx + tailwind-merge). No `style={{}}` props for colors or spacing.
- Variants via CVA (`class-variance-authority`). Never branch on props with inline ternaries for more than one class.
- Use `data-slot` attributes on compound component parts so parent selectors can target them.
- `@container` queries for card-internal responsive layouts (already established in `components/ui/card.tsx`).
- Skeleton states use `components/ui/skeleton.tsx` — do not add new loading primitives.
- New page-level data components go in `components/<route-name>/` mirroring the app route (e.g. `components/team/`).

## Security rules (non-negotiable)

- `ANTHROPIC_API_KEY` in Vercel env vars only — never in client bundle
- `SUPABASE_SERVICE_KEY` in Vercel env vars only — never in client bundle
- No direct browser calls to Tempo, Zoho, Supabase, or Claude API
- All external calls go through Next.js API routes or server components
- Authentication required on all routes — no public pages
- Role-based data scoping: `account_manager` receives filtered context

## `/api/chat` contract (C-004)

```
POST /api/chat
Request:  { "message": string, "userRole": "admin | leadership | account_manager" }
Response: { "response": string }
```

- Supabase Auth session required — unauthenticated requests return 401
- Every call writes a row to Supabase `audit_log` (userId, timestamp, message summary)
- Role limits what data context the agent can reference in its response

## Utilization formula (C-005)

```
billable_utilization = billable_hours / (monthly_target × days_elapsed / total_working_days)
```

Must match `capacity/SKILL.md` exactly. If this formula changes, update `capacity/doc/CONTRACTS.md`
and `capacity/doc/DECISIONS.md` before changing any code here.

## Cross-repo coordination — READ FIRST

Before making any decision that crosses repo boundaries, consult the central registry in the `capacity` repo:

- **Decisions:** [capacity/doc/DECISIONS.md](../capacity/doc/DECISIONS.md)
- **Contracts:** [capacity/doc/CONTRACTS.md](../capacity/doc/CONTRACTS.md)

Contracts this repo consumes:
- **C-003** — Supabase schema (v2 tables; read-only except `audit_log`)
- **C-004** — Claude API proxy (this repo owns the implementation)
- **C-005** — Utilization formula (must match [capacity/SKILL.md](../capacity/) exactly)

**If you change the utilization formula or the `/api/chat` contract:**
1. Update `capacity/doc/CONTRACTS.md` first
2. Note the change in `capacity/doc/DECISIONS.md` if architectural

## What NOT to do

- Do not write new queries against v1 tables (`worklogs_snapshot`, `plans_snapshot`, `project_actuals_snapshot`, `capacity_baseline`, `fragmentation_snapshot`)
- Do not write to any Supabase table other than `audit_log`
- Do not add a SQLite database, local cache, or sync orchestrator (D-009)
- Do not add API keys or secrets to any file that could be committed
- Do not make external API calls from client components
- Do not add agent reasoning logic to the dashboard — keep it as a thin consumer
- Do not hard-code `snapshot_id` values — always resolve the latest from `sync_snapshot`
- Do not use Clerk — authentication is Supabase Auth with Google OAuth (D-018)
- Do not write context or documents in any language other than English
- Avoid usage of emojis
