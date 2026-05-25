# capacity-dashboard

Passive consumption interface for leadership and account management at **Mira Commerce**.
Built with Next.js, deployed to Vercel, authenticated via Supabase Auth (Google SSO).

---

## Getting started (local)

Do this in order the first time you work on the repo.

| Step | What to do |
|---|---|
| **1. Prerequisites** | [Node.js](https://nodejs.org/) 20+ and [pnpm](https://pnpm.io/) (`corepack enable` is fine). Optional: [Supabase CLI](https://supabase.com/docs/guides/cli) if you will run `pnpm db:types`. |
| **2. Install** | `pnpm install` |
| **3. Environment** | Copy the example file: `cp .env.example .env.local` — then set **`NEXT_PUBLIC_SUPABASE_URL`**, **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**, and **`SUPABASE_SERVICE_ROLE_KEY`** (Supabase dashboard: *Project Settings* > *API*). The service role key is **server-only**; keep `.env.local` out of git. |
| **4. (Recommended) TypeScript types** | Authenticate the CLI: `supabase login` (one-time per machine). Then `pnpm db:types` to refresh `lib/supabase/database.types.ts` from the live `public` schema. If you skip this, the committed types may still match, or you may need to regen after schema changes. Details: [Supabase TypeScript types](#supabase-typescript-types-dbtypes) below. |
| **5. Run the app** | `pnpm dev` — open [http://localhost:3000](http://localhost:3000), sign in with Google (Mira Commerce workspace account per your Supabase Auth / Google provider setup). |
| **6. Productive checks** | `pnpm build` should pass before you open a PR. Data-heavy pages need a project with ingestion run (`sync_snapshot`, `fact_worklogs`, etc.). |

If `pnpm db:types` errors with *Access token not provided*, run `supabase login` or set `SUPABASE_ACCESS_TOKEN` for that shell (that token is not the same as the keys in `.env.local`).

---

## What it does

Provides a read-only view of capacity data for people who do not have direct agent access:

| Audience | What they see |
|---|---|
| Leadership | Aggregate utilization, bench rate, 8-week trend |
| Account managers | Project-level staffing, SLA flags |
| Engineering managers | Quick read-only access without the CLI agent |

It is **not** a replacement for the agent. The agent remains the power-user tool for analysis, report generation, and decision support.

---

## Architecture

```
Browser (authenticated)
    ↓ Supabase Auth (Google OAuth, Google Workspace)
Next.js 16 App Router (Vercel)
    ↓ Supabase client → Supabase (read-only, service role key)
```

All API keys stay server-side. No direct browser calls to Supabase.

> **Not yet shipped:** `/api/chat` (Claude API proxy) — wired up in Phase D alongside the `/ask` page.

---

## Routes

| Route | Status | Content |
|---|---|---|
| `/` | ✅ shipped | Overview — KPIs, weekly evolution chart, role breakdown |
| `/capacity/overview` | ✅ shipped | Capacity KPIs + charts by role |
| `/capacity/utilization` | ✅ shipped | Per-person utilization table, staffing grid, role analytics |
| `/capacity/planning` | ✅ shipped | Project-grain plans, capacity horizon (6-month rolling) |
| `/capacity/bench` | placeholder | Bench roster |
| `/capacity/allocations` | placeholder | Allocation detail |
| `/capacity/operations` | placeholder | Ops view |
| `/capacity/scenarios` | placeholder | What-if scenarios |
| `/teams/overview` | ✅ shipped | Teams summary |
| `/teams/composition` | ✅ shipped | Role-sorted roster cards with filter |
| `/teams/health` | placeholder | Team health signals |
| `/teams/staffing` | placeholder | Staffing coverage |
| `/teams/skills-coverage` | placeholder | Skills coverage |
| `/teams/dependencies` | placeholder | Cross-team dependencies |
| `/people/*` | placeholder | Directory, utilization, availability, skills, performance, fragmentation |
| `/projects/*` | placeholder | Portfolio, health, staffing, financials, delivery, dependencies |
| `/pipeline` | redirect → `/` | Removed — not yet re-implemented |
| `/flags` | redirect → `/` | Removed — not yet re-implemented |
| `/team` | redirect → `/capacity/utilization` | Legacy route, permanent redirect |
| `/ask` | stub | Claude query interface — coming in Phase D |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16, App Router, TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Custom SVG (inline, server-rendered) + `@base-ui/react` primitives — no Recharts |
| Auth | Supabase Auth (Google OAuth, Google Workspace) |
| Database | Supabase (read-only, service role) |
| Deployment | Vercel |

---

## Supabase TypeScript types (`db:types`)

The app imports table shapes from `lib/supabase/database.types.ts`. That file should stay aligned with the **live `public` schema** in your Supabase project.

| | |
|---|---|
| **Command** | `pnpm db:types` |
| **What it does** | Runs the Supabase CLI to pull the `public` schema and **overwrite** `lib/supabase/database.types.ts` with generated TypeScript types. |
| **When to run** | After migrations land in `capacity-mcp` (or any change to tables, columns, or enums) that this dashboard will query. Also after cloning the repo for the first time if you need strict typing that matches the remote project. Re-run if your local types drift and TypeScript or queries break. |
| **Prerequisite** | The CLI must be **authenticated to Supabase** (this is *not* the same as `NEXT_PUBLIC_SUPABASE_*` or the service role key in `.env.local`). Do **one** of: run `supabase login` once on your machine, or set a personal `SUPABASE_ACCESS_TOKEN` in the environment for that shell or CI. Without this, the command fails with "Access token not provided." |
| **Secrets** | Do **not** put access tokens in the repo or in `.env.local` for the Next.js app unless you have a clear team convention and keep it out of version control. Prefer `supabase login` for local work. |

The Supabase project id used by the script is set in the `db:types` entry in `package.json`. If the project id ever changes, update it there, then run `pnpm db:types` again.

---

## Auth model

- Google OAuth via Supabase Auth (Mira Commerce Google Workspace)
- All routes require authentication — no public pages (`proxy.ts` middleware enforces the redirect to `/login`)
- **Role-based access (planned, not yet enforced):** roles `admin`, `leadership`, `account_manager` will be stored in `auth.users.raw_app_meta_data`. Role-gated data scoping and query filtering are not yet implemented. **Access approval workflow** (pre-listed emails, admin notify, RBAC phases) is specified in [docs/SP_AUTH_PLAN.md](docs/SP_AUTH_PLAN.md) — deferred.

---

## Security

- Supabase service key: Vercel environment variable, never in client bundle
- No direct browser calls to external APIs
- **Audit log (planned):** agent queries will be logged to an `audit_log` Supabase table in Phase D — not yet implemented

---

## Cross-repo dependencies

| Dependency | What it needs |
|---|---|
| `capacity-mcp/supabase/migrations/` | Supabase schema must be provisioned |
| `capacity` weekly reports | Snapshot data written to Supabase by the agent |
| `capacity-mcp` SSE transport | Phase 2 — for direct MCP calls from the dashboard |

---

## Cross-repo coordination

Governed by the central registry in the `capacity` repo:
- Architectural decisions: `capacity/doc/DECISIONS.md`
- Interface contracts: `capacity/doc/CONTRACTS.md`
