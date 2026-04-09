# capacity-dashboard — Project Instructions

## What this repo is

Passive consumption interface for leadership and account management.
Not a replacement for the agent — the agent remains the power-user tool.

**Audience:**
- Leadership: aggregate utilization, bench rate, trend charts
- Account managers: project-level staffing view, SLA flags
- EM: quick read-only access when not at Claude Code workstation

**This repo does NOT own:**
- Agent skills or CLAUDE.md logic (those live in `capacity`)
- MCP servers (those live in `capacity-mcp`)
- Supabase schema migrations (those live in `capacity-mcp/supabase/migrations/`)
- Any write path to the database (all writes come from `capacity-mcp` ingestion script)

## Tech stack

Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, Recharts.
Clerk for authentication. Supabase (service role, server-side only) for all data reads.
Deployed on Vercel.

## Data store

**Single data store: Supabase.** The dashboard is a pure read-only Supabase consumer.

There is no SQLite cache, no sync orchestrator, no local database. All views read
directly from Supabase tables populated by the `capacity-mcp` ingestion script.

This is a firm architectural decision (D-009). Do not reintroduce SQLite or a local cache.

### Tables consumed (read-only)

| Table | Purpose |
|---|---|
| `worklogs_snapshot` | Per-worklog logged/billable hours with project classification |
| `plans_snapshot` | Per-person per-project planned hours by month |
| `project_actuals_snapshot` | Exact per-project logged and billable hours by month |
| `capacity_baseline` | Zone-adjusted net capacity per person per month |
| `fragmentation_snapshot` | Pre-computed fragmentation flags per person per month |
| `holiday_calendar` | Company-observed holidays by zone |
| `team_zones` | Person to holiday zone mapping |

Write access: `audit_log` only (one row per `/api/chat` call).

## Authentication

Clerk with Google SSO (Mira Commerce Google Workspace).

| Role | Access |
|---|---|
| `admin` | All data — EM |
| `leadership` | All aggregate views |
| `account_manager` | Project-level only (filtered context) |

All routes require authentication. No public pages. Clerk middleware enforces this globally.

## Core views (Phase 3)

| Route | Content |
|---|---|
| `/` | Utilization overview: current week, 8-week trend, bench rate |
| `/team` | Individual utilization table, role breakdown |
| `/flags` | Open risk flags, severity, age |
| `/pipeline` | Deal list with capacity impact estimate |
| `/ask` | Agent query interface (calls `/api/chat`, returns agent response) |

## Security rules (non-negotiable)

- `ANTHROPIC_API_KEY` in Vercel env vars only — never in client bundle
- `SUPABASE_SERVICE_KEY` in Vercel env vars only — never in client bundle
- No direct browser calls to Tempo, Zoho, Supabase, or Claude API
- All external calls go through Next.js API routes or server components
- Authentication required on all routes — no public pages (Clerk middleware)
- Role-based data scoping: `account_manager` receives filtered context

## `/api/chat` contract (C-004)

```
POST /api/chat
Request:  { "message": string, "userRole": "admin | leadership | account_manager" }
Response: { "response": string }
```

- Clerk session required — unauthenticated requests return 401
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

- **Decisions:** `capacity/doc/DECISIONS.md`
- **Contracts:** `capacity/doc/CONTRACTS.md`

Contracts this repo consumes:
- **C-003** — Supabase schema (read all tables above; write `audit_log`)
- **C-004** — Claude API proxy (this repo owns the implementation)
- **C-005** — Utilization formula (must match `capacity/SKILL.md` exactly)

**If you change the utilization formula or the `/api/chat` contract:**
1. Update `capacity/doc/CONTRACTS.md` first
2. Note the change in `capacity/doc/DECISIONS.md` if architectural

## What NOT to do

- Do not write to any Supabase table other than `audit_log`
- Do not add a SQLite database, local cache, or sync orchestrator (D-009)
- Do not add API keys or secrets to any file that could be committed
- Do not make external API calls from client components
- Do not add agent reasoning logic to the dashboard — keep it as a thin consumer
- Do not write context or documents in any language other than English
- Avoid usage of emojis
