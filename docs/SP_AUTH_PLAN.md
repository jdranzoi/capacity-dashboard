# SP-AUTH — Access approval, RBAC, and data scoping

> **Subplan:** SP-AUTH (security track, parallel to Phase 1 feature work)  
> **Status:** **Deferred** — documented only; implementation when Capacity / Teams priorities allow.  
> **Checkpoint:** [PROJECT_STATUS.md](./PROJECT_STATUS.md) · **IA (role access):** [NAVIGATION_FUNCTIONAL.md](./NAVIGATION_FUNCTIONAL.md)

This plan covers three layers: **who may sign in**, **which dashboard sections they see**, and **which data rows loaders return**. Only the first layer is required for the initial ship; the rest can follow incrementally.

---

## Product decisions (locked)

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Who may register | **Pre-listed emails only.** No “anyone @company domain → pending” auto-queue. An email must exist on `dashboard_users` (or equivalent) with `status = active` before OAuth may create a session. Unknown emails: block signup + optional access-request record for audit (admin still adds email manually). |
| 2 | Bootstrap admins | **2–3 people**, TBD at implementation time. Two supported paths (either is fine for v1): **(A)** seed rows via Supabase SQL / Table Editor; **(B)** first admin created by migration + later manage all users in **Admin → Users** in the dashboard. Prefer (B) long-term; (A) acceptable for day-one. |
| 3 | PM / project ownership | **Current month via `fact_plans`** + existing `PM_ROLE_KEY` / `resolvePmForMembers` (see `lib/teams/composition/teams-composition-utils.ts`) is sufficient for scoped roles. **Person changes** (old PM vs new PM, overlap, historical views) — **explicitly out of scope** until a later design pass; do not block SP-AUTH Phase 1–3. |
| 4 | Admin notification email | **TBD at implementation** — see [§ Email delivery](#email-delivery-plain-language) below. Not a product blocker for writing schema/hooks. |
| 5 | Ship order | **Ship access approval first** (Phases 0–2). **Data scoping (Phase 4)** and **section-level RBAC (Phase 3)** can trail. Until Phase 4 ships, **approved users see the same routes and data as today** (full dashboard for anyone on the allowlist). |

---

## Current state (baseline)

| Area | Today |
| --- | --- |
| Auth | Google OAuth via Supabase (`/login` → `/auth/callback`) |
| Gate | `lib/supabase/middleware.ts` — session exists only |
| Roles | `app_metadata.role`: `admin` \| `leadership` \| `account_manager` — **display only** (`components/layout/header.tsx`) |
| Enforcement | None — [README.md](../README.md) documents RBAC as planned |
| `dim_person` | No `email` column — link auth user ↔ person via admin UI (v1) or ingestion later |

---

## Target architecture (three layers)

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Access (SP-AUTH Phase 0–2)  ← ship first              │
│  Pre-listed email → before-user-created hook → session or block  │
│  Admin email on blocked attempt · /admin access requests (opt.)  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  LAYER 2 — Section RBAC (Phase 3)  ← later                       │
│  dashboard_role + section grants · sidebar / route guards        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  LAYER 3 — Data scope (Phase 4)  ← later                       │
│  projectIds / personIds in loaders · pm/tl/dev templates        │
└─────────────────────────────────────────────────────────────────┘
```

**Dashboard roles** (app access) are **not** the same as **`dim_role`** keys (`fsd`, `pm`, `tl`, …) in workforce data.

| Dashboard role | Intended audience | Default sections (when Phase 3 ships) | Default data scope (when Phase 4 ships) |
| --- | --- | --- | --- |
| `admin` | Platform / EM owners | All | Full org |
| `leadership` | Directors, PMO | Overview, Capacity, People (aggregate), Teams, Projects | Full org |
| `account_manager` | Account managers | Projects (+ Ask) | Assigned commercial projects |
| `pm` | Project managers | Projects, Teams (composition), People (subset), Capacity (subset) | PM projects (plans) + people on those projects |
| `tl` | Tech leads | Teams, People, Projects, Capacity (subset) | Assigned projects + teammates |
| `dev` | IC engineers | People, Projects, limited Capacity | Self + same-project teammates |

Until Phase 3–4: allowlisted users keep **today’s full navigation and unscoped loaders**.

---

## Layer 1 — Pre-listed access only

### Flow

1. User starts Google OAuth on `/login`.
2. Supabase **`before-user-created`** hook runs (Edge Function or Postgres function in `capacity-mcp`).
3. Hook loads `dashboard_users` by normalized email:
   - **`active`** → HTTP 200 → user created → normal callback.
   - **Missing or not active** → HTTP 4xx → **user not created** → redirect to `/login?status=not_allowed` (or `pending` if you still log a request row for audit).
4. Optional: on block, insert `access_requests` (email, name, attempted_at) and send admin notification — **informational only**; approval = admin adds email to `dashboard_users`, user tries again.

### Pre-list rules (strict)

- No automatic approval by domain alone.
- Adding a user = explicit row: `email`, `status`, `dashboard_role`, optional `person_id`, optional `approved_by` / `approved_at`.
- Removing access = set `status` to `revoked` or delete row; hook denies on next signup attempt.

### Email delivery (plain language)

When someone **not** on the list tries to sign in, admins may want an email: “X tried to access the dashboard.”

That requires choosing **who sends the email**:

| Option | What it means |
| --- | --- |
| **Resend / Postmark / SendGrid** | A small SaaS API (API key in Supabase secrets). Edge Function calls their API. Typical for Vercel + Supabase stacks. |
| **Company SMTP / Google Workspace** | Send through your existing mail server (more IT setup). |
| **Slack webhook** | Instant message instead of email — optional supplement. |

**Decision deferred** until implementation; schema and hook logic do not depend on the vendor.

### Supabase primitives

| Piece | Purpose |
| --- | --- |
| [`before-user-created` hook](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook) | Block or allow user creation (OAuth included) |
| [`custom_access_token` hook](https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook) (Phase 3+) | Put `dashboard_role`, `access_status` in JWT |
| Service role in Edge Function | Read `dashboard_users`; write `access_requests` |

---

## Layer 2 — Section RBAC (deferred)

### Schema (planned)

```text
dashboard_user_sections
  user_id, section_key, level ('none' | 'read')

dashboard_role_templates
  dashboard_role, section_key, level
```

`section_key` aligns with Level 1 / critical Level 2 routes: `overview`, `capacity`, `capacity.utilization`, `people`, `teams`, `projects`, `ask`.

### App changes (planned)

- `lib/auth/get-viewer-context.ts` — session + `dashboard_users` row.
- Middleware / `(dashboard)/layout.tsx` — redirect to `/unauthorized` when section denied.
- Filter `lib/navigation/sidebar-nav-config.ts` and command menu by grants.
- Tag routes in `lib/navigation/navigation-catalog.ts` with `requiredSection`.

---

## Layer 3 — Data scoping (deferred)

### Central helper (planned)

```typescript
// lib/auth/viewer-scope.ts (illustrative)
type ViewerScope = {
  dashboardRole: DashboardRole
  personId: string | null
  projectIds: Set<string> | null  // null = full org
  personIds: Set<string> | null
}
```

Apply in loaders starting with **Projects** and **Teams composition**, then Capacity utilization / People.

### PM detection (when Phase 4 starts)

- Use **`fact_plans`** for current month + `PM_ROLE_KEY` / `resolvePmForMembers`.
- Optional explicit grants: `dashboard_user_projects`.

### Open design — PM handover (later)

Not required for SP-AUTH v1. Questions to answer in a future ADR:

- When PM changes on a project, do **both** old and new PM retain access, or **only current**?
- Does “current” mean **this month’s plan** only, or a rolling window?
- Should historical months show the PM who owned the project **that month**?

Document answers in `capacity/doc/DECISIONS.md` before changing loaders.

### Auth ↔ `dim_person`

| Approach | When |
| --- | --- |
| Admin picks person on approve/edit | **v1** |
| `email` on `dim_person` from ingestion | **v2** — auto-link on approve |

---

## Schema (capacity-mcp) — planned tables

Migrations live in **`capacity-mcp`** (dashboard read-only per D-009). Suggested names:

| Table | Purpose |
| --- | --- |
| `dashboard_users` | `id`, `email` (unique), `auth_user_id` (nullable until first login), `status` (`active` \| `revoked`), `dashboard_role`, `person_id` (FK `dim_person`, nullable), `created_at`, `approved_by`, `approved_at` |
| `access_requests` | Optional audit: blocked attempts (`email`, `display_name`, `attempted_at`, `notified_at`) |
| `dashboard_user_sections` | Phase 3 — per-user section overrides |
| `dashboard_user_projects` | Phase 4 — explicit project grants |
| `dashboard_role_templates` | Phase 3 — default section map per role |

**RLS:** service-role only from dashboard; no client writes except future admin API routes using service role server-side.

**Seed (day one):** 2–3 admin emails in `dashboard_users` via migration SQL.

---

## Implementation phases

### Phase 0 — Schema and ADR (~2–3 days)

| # | Task | Repo |
| --- | --- | --- |
| 0.1 | ADR in `capacity/doc/DECISIONS.md`: pre-list-only, bootstrap admins, defer PM handover | capacity |
| 0.2 | Migrations for `dashboard_users` (+ optional `access_requests`) | capacity-mcp |
| 0.3 | Seed admin emails (placeholder or env-driven migration) | capacity-mcp |
| 0.4 | Regenerate `lib/supabase/database.types.ts` | capacity-dashboard |

**Exit:** types and tables exist; no user-facing change yet.

---

### Phase 1 — Approval gate (~4–5 days) — **minimum ship**

| # | Task |
| --- | --- |
| 1.1 | Configure `before-user-created` hook → allow only `dashboard_users.status = active` |
| 1.2 | Login page states: `not_allowed`, `auth_callback_failed` copy |
| 1.3 | Optional: on block, write `access_requests` + notify admin (email provider TBD) |
| 1.4 | Middleware safety: session without matching `dashboard_users` → sign out + message |
| 1.5 | Env docs: hook secret, `ADMIN_NOTIFICATION_EMAILS` (comma-separated) |

**Exit:** only pre-listed emails can use the app; everyone else blocked at OAuth.

**Explicit non-goals for Phase 1:** section hiding, loader filters, PM handover rules.

---

### Phase 2 — Admin UI (~3–4 days)

| # | Task |
| --- | --- |
| 2.1 | `/admin/users` — admin-only (first admins from seed) |
| 2.2 | CRUD: add email, set `dashboard_role`, link `person_id`, revoke |
| 2.3 | Optional: list `access_requests` (read-only audit) |
| 2.4 | Approve-via-email link (signed token) — optional nice-to-have |

**Exit:** no routine Supabase Table Editor edits for access.

---

### Phase 3 — Section RBAC (~3–4 days)

| # | Task |
| --- | --- |
| 3.1 | `dashboard_role_templates` + `dashboard_user_sections` |
| 3.2 | `custom_access_token` hook |
| 3.3 | Sidebar + route guards |
| 3.4 | Update [NAVIGATION_FUNCTIONAL.md](./NAVIGATION_FUNCTIONAL.md) enforcement notes |

**Exit:** pm/tl/dev can be limited by section (templates + overrides).

---

### Phase 4 — Loader scoping (~5–8 days, incremental)

| Priority | Routes |
| --- | --- |
| P0 | `/projects/*` |
| P1 | `/teams/composition`, staffing |
| P2 | `/capacity/utilization`, `/people/*` |
| P3 | `/`, `/capacity/overview` (define leadership vs scoped aggregates) |
| P4 | `/api/chat` — role and scope from session only (C-004) |

**Exit:** pm/tl/dev see only scoped rows; leadership/admin unchanged.

**Until this phase:** approved users see **unscoped** data (current behavior).

---

### Phase 5 — Hardening (~2–3 days)

| # | Task |
| --- | --- |
| 5.1 | Rate-limit `access_requests` per email |
| 5.2 | Login audit table (optional) |
| 5.3 | Security review: hook secrets, approve tokens, admin API auth |
| 5.4 | E2E: blocked email, active email, revoked user |

---

## Code locations (planned)

| Area | Path |
| --- | --- |
| Viewer context | `lib/auth/get-viewer-context.ts` |
| Scope resolution | `lib/auth/viewer-scope.ts` |
| Admin routes | `app/(dashboard)/admin/*`, `app/api/admin/*` |
| Login states | `app/login/page.tsx` |
| Middleware | `lib/supabase/middleware.ts` (extend after Phase 1) |
| Hooks | `capacity-mcp/supabase/functions/*` (or documented Edge deployment) |

---

## Dependencies and sequencing

```text
SP-2 / SP-4 feature work     ── continues in parallel
SP-AUTH Phase 0–1            ── when you pause for security baseline
SP-AUTH Phase 2              ── admin self-service (recommended before growing allowlist)
SP-AUTH Phase 3–4            ── when pm/tl/dev roles get real users
```

Do **not** assign `pm` / `tl` / `dev` dashboard roles to real users until **Phase 4** covers their primary routes — unless you accept full-org visibility (same as today).

---

## Progress tracker

| Phase | Scope | Status |
| --- | --- | --- |
| **Phase 0** | Schema + ADR | Not started |
| **Phase 1** | Pre-list hook + login UX | Not started |
| **Phase 2** | Admin users UI | Not started |
| **Phase 3** | Section RBAC | Not started |
| **Phase 4** | Loader scoping | Not started |
| **Phase 5** | Hardening | Not started |

Update this table when work starts or completes; bump [PROJECT_STATUS.md](./PROJECT_STATUS.md) **Last updated** line.

---

## References

- [CLAUDE.md](../CLAUDE.md) — D-018, roles in `app_metadata`, C-004 chat contract
- [.cursor/IMPLEMENTATION_STRATEGY.md](../.cursor/IMPLEMENTATION_STRATEGY.md) — `getViewerRole`, account_manager scoping notes
- [docs/PERFORMANCE_ROADMAP.md](./PERFORMANCE_ROADMAP.md) — cache + role scope
- Supabase: [Before User Created](https://supabase.com/docs/guides/auth/auth-hooks/before-user-created-hook), [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks)
