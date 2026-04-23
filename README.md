# capacity-dashboard

Passive consumption interface for leadership and account management at **Mira Commerce**.
Built with Next.js, deployed to Vercel, authenticated via Supabase Auth (Google SSO).

**Status: Phase 3 — in development.** The app shell, auth, and the overview’s **weekly metrics** (net capacity, planned, availability, PTO, billable, logged — v2 + proration) are in place. Remaining: other routes, 8-week chart, `/api/chat` proxy, etc. **How those numbers are defined:** [CLAUDE.md](CLAUDE.md) (*Overview page — weekly metrics*). Build order: [.cursor/IMPLEMENTATION_STRATEGY.md](.cursor/IMPLEMENTATION_STRATEGY.md).

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
| **6. Productive checks** | `pnpm build` should pass before you open a PR. Data-heavy pages need a project with ingestion run (`sync_snapshot`, `fact_worklogs`, etc. per `CLAUDE.md`). |

If `pnpm db:types` errors with *Access token not provided*, run `supabase login` or set `SUPABASE_ACCESS_TOKEN` for that shell (see the [db:types section](#supabase-typescript-types-dbtypes); that token is not the same as the keys in `.env.local`).

---

## What it will do

Provides a read-only view of capacity data for people who do not have Claude Code access:

| Audience | What they see |
|---|---|
| Leadership | Aggregate utilization, bench rate, 8-week trend |
| Account managers | Project-level staffing, SLA flags |
| Engineering managers | Quick read-only access without Claude Code |

It is **not** a replacement for the agent. The agent remains the power-user tool for analysis, report generation, and decision support.

---

## Planned architecture

```
Browser (authenticated)
    ↓ Supabase Auth (Google OAuth, Google Workspace)
Next.js 15 App Router (Vercel)
    ↓ /api/chat       → Claude API (server-side proxy)
    ↓ Supabase client → Supabase (read-only, service role key)
```

All API keys stay server-side. No direct browser calls to Claude or Supabase.

---

## Planned views

| Route | Content |
|---|---|
| `/` | Utilization overview — current week, 8-week trend, bench rate |
| `/team` | Per-person utilization table by role |
| `/flags` | Open risk flags — severity, age, status |
| `/pipeline` | Deal list with capacity impact estimate |
| `/ask` | Free-text agent query (calls `/api/chat` proxy) |

---

## Planned tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts or shadcn/ui charts |
| Auth | Supabase Auth (Google OAuth, role-based — D-018) |
| Database | Supabase (read-only, service role — D-009) |
| Deployment | Vercel |

---

## Supabase TypeScript types (`db:types`)

The app imports table shapes from `lib/supabase/database.types.ts`. That file should stay aligned with the **live `public` schema** in your Supabase project (see C-003 in the `capacity` repo).

| | |
|---|---|
| **Command** | `pnpm db:types` |
| **What it does** | Runs the Supabase CLI to pull the `public` schema and **overwrite** `lib/supabase/database.types.ts` with generated TypeScript types. |
| **When to run** | After migrations land in `capacity-mcp` (or any change to tables, columns, or enums) that this dashboard will query. Also after cloning the repo for the first time if you need strict typing that matches the remote project. Re-run if your local types drift and TypeScript or queries break. |
| **Prerequisite** | The CLI must be **authenticated to Supabase** (this is *not* the same as `NEXT_PUBLIC_SUPABASE_*` or the service role key in `.env.local`). Do **one** of: run `supabase login` once on your machine, or set a personal `SUPABASE_ACCESS_TOKEN` in the environment for that shell or CI. Without this, the command fails with “Access token not provided.” |
| **Secrets** | Do **not** put access tokens in the repo or in `.env.local` for the Next.js app unless you have a clear team convention and keep it out of version control. Prefer `supabase login` for local work. |

The Supabase project id used by the script is set in the `db:types` entry in `package.json`. If the project id ever changes, update it there, then run `pnpm db:types` again.

---

## Auth model

- Google OAuth via Supabase Auth (Mira Commerce Google Workspace) — see D-018
- All routes require authentication — no public pages (`proxy.ts` enforces this)
- Roles: `admin` (EM), `leadership`, `account_manager`
- Roles stored in `auth.users.raw_app_meta_data` — immutable by users
- Role determines data scope visible in queries and agent context

---

## Security

- Claude API key: Vercel environment variable, never in client bundle
- Supabase service key: Vercel environment variable, never in client bundle
- No direct browser calls to external APIs
- All agent queries logged to `audit_log` table in Supabase

---

## Cross-repo dependencies

| Dependency | What it needs |
|---|---|
| `capacity-mcp/supabase/migrations/` | Supabase schema must be provisioned (Phase 1b) |
| `capacity` weekly reports | Snapshot data written to Supabase by the agent (Phase 1b) |
| `capacity-mcp` SSE transport | Phase 2 — for direct MCP calls from the dashboard |

---

## Cross-repo coordination

Governed by the central registry in the `capacity` repo:
- Architectural decisions: `capacity/doc/DECISIONS.md`
- Interface contracts: `capacity/doc/CONTRACTS.md`
