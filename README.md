# capacity-dashboard

Passive consumption interface for leadership and account management at **Mira Commerce**.
Built with Next.js 15, deployed to Vercel, authenticated via Clerk.

**Status: Phase 3 — not yet built.**
This repo is a placeholder. Development starts after Phase 1 (Tempo MCP + Supabase) and Phase 2 (Zoho + pipeline alerts) are stable.

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
    ↓ Clerk auth (Google SSO)
Next.js 15 App Router (Vercel)
    ↓ /api/chat       → Claude API (server-side proxy)
    ↓ Supabase client → Supabase (read-only, service key)
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
| Auth | Clerk (Google SSO, role-based) |
| Database | Supabase (read-only client) |
| Local cache | SQLite via Drizzle ORM (sync cache, fast reads) |
| Deployment | Vercel |

---

## Reference prototype

`capacity-v2` (separate repo) has Phase 1 complete: 14-table schema, 4 API clients, sync orchestrator, People view.
`capacity-dashboard` will be seeded from that work, not built from scratch.

See `capacity/doc/DECISIONS.md` → D-004 for the full seeding decision.

---

## Auth model

- Google SSO via Clerk (Mira Commerce Google Workspace)
- All routes require authentication — no public pages
- Roles: `admin` (EM), `leadership`, `account_manager`
- Role determines data scope visible in queries

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
