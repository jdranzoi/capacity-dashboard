# Collaboration Network — Supabase queries and graph build

**Code:** `lib/teams/collaboration/load-collaboration-network.ts` (I/O) · `lib/teams/collaboration/build-collaboration-graph.ts` (pure graph, no DB).

**Route:** `/teams/collaboration-network` · **Source of truth for relationships:** `fact_plans` (planned staffing), not `fact_worklogs`.

---

## 1. Month window and snapshots

### 1.1 Available months (anchor resolution)

**View:** `v_dashboard_month_options`

**PostgREST (via `loadOverviewMonthOptions`):**

```http
GET /rest/v1/v_dashboard_month_options
  ?select=month_date,snapshot_id,sync_created_at
  &order=month_date.desc
```

**SQL equivalent:**

```sql
SELECT month_date, snapshot_id, sync_created_at
FROM v_dashboard_month_options
ORDER BY month_date DESC;
```

**Month picker:** `?month=yyyy-MM` (same param as Overview). Options from `v_dashboard_month_options`, filtered in `load-collaboration-network.ts` (`monthPickerOptions`):

- **Rolling 12 months** — current calendar month plus the 11 prior (e.g. in June 2026: `2025-07` … `2026-06`)
- **Snapshots only** — a month appears in the picker only if it has a row in `v_dashboard_month_options` (latest sync for that `month_date`); gaps in the 12-month window are omitted
- **Default** — current calendar month when present in the list, else newest available

The graph loads **one** month per view (that month’s `snapshot_id` on `fact_plans` / `fact_fragmentation`).

---

## 2. Core query — plan assignments (graph input)

Executed **once per month** in the window (paginated, 1000 rows per page).

**Table:** `fact_plans`

**PostgREST:**

```http
GET /rest/v1/fact_plans
  ?select=person_id,project_id,month_date,role_id
  &snapshot_id=eq.{snapshotId}
  &month_date=eq.{monthStartStr}
  &is_pto=eq.false
  &project_id=not.is.null
  &planned_hours=gt.0
  &order=person_id.asc
  &offset=0
  &limit=1000
```

**SQL equivalent:**

```sql
SELECT person_id, project_id, month_date, role_id
FROM fact_plans
WHERE snapshot_id = :snapshot_id
  AND month_date = :month_start_str   -- e.g. '2026-06-01'
  AND is_pto = false
  AND project_id IS NOT NULL
  AND planned_hours > 0
ORDER BY person_id
LIMIT 1000 OFFSET :offset;
```

**Filters (why rows disappear):**

| Condition | Effect |
|-----------|--------|
| `planned_hours > 0` | Zero-hour plan lines excluded |
| `is_pto = false` | PTO / HR lines excluded |
| `project_id IS NOT NULL` | Unassigned plan rows excluded |
| Wrong `snapshot_id` / `month_date` | Person missing for that month |

---

## 3. Role resolution (PM / TL on matrix)

Per person, role is chosen in order:

1. **`role_id` on `fact_plans`** for the **anchor month** (any plan line).
2. Else first `role_id` seen on plans in other months in the window.
3. Else **`fetchMonthRolesForPeople`** for anchor month (`lib/workforce/month-role.ts`):
   - `fact_bench` → `fact_plans` → `fact_worklogs` (gaps only).
4. Else `dim_person.role_id`.

**PostgREST for month roles (anchor snapshot):**

```http
GET /rest/v1/fact_bench?select=person_id,role_id
  &snapshot_id=eq.{snapshotId}&month_date=eq.{monthStartStr}

GET /rest/v1/fact_plans?select=person_id,role_id
  &snapshot_id=eq.{snapshotId}&month_date=eq.{monthStartStr}

GET /rest/v1/fact_worklogs?select=person_id,role_id
  &log_date=gte.{monthStartStr}&log_date=lte.{monthEndStr}
  &person_id=in.({uuid,...})
```

**Role labels:**

```http
GET /rest/v1/dim_role?select=id,key,label
```

---

## 4. Dimensions

### 4.1 Projects (batched by 200 ids)

```http
GET /rest/v1/dim_project
  ?select=id,project_key,project_name,project_type
  &id=in.({uuid,...})
```

### 4.2 People (batched by 200 ids)

```http
GET /rest/v1/dim_person
  ?select=id,name,role_id,zone_id,is_active
  &id=in.({uuid,...})

GET /rest/v1/dim_zone?select=id,key,label
```

---

## 5. How the graph is built (in memory)

No extra Supabase calls after the loads above. Logic in `build-collaboration-graph.ts`:

### 5.1 Participation records

One record per `(person_id, project_id)` aggregated across months:

- `firstLog` / `lastLog` → earliest / latest `month_date` with a plan line.
- `loggedInAnchorMonth` → planned on that project in the anchor month.

### 5.2 Nodes

- **Every** `person_id` with at least one plan line in the window (any project type).
- `activeProjects` = count of projects matching the **category** filter (`all` | `build` | `support` | `internal`).
- `collaborators` = graph degree (number of other people linked by a shared project).

### 5.3 Edges

For each **project** (optionally filtered by `project_type`):

- Take all distinct `person_id` on that project.
- For every pair `(A, B)` on the same project → undirected edge.
- **Weight** = number of shared projects (category-scoped) between the pair.

### 5.4 PM ↔ TL matrix

- **Rows:** all people with resolved role `tl`.
- **Columns:** all people with resolved role `pm`.
- **Cell (PM, TL):** count of projects where **both** are planned (same project, category-scoped).
- PMs/TLs with no shared project still appear; cell shows `·` (zero).

### 5.5 KPIs

| KPI | Formula |
|-----|---------|
| Active collaborators | Node count |
| Avg. connections | Sum of degrees / node count |
| Collaboration density | `edges / (n×(n-1)/2)` as % |
| Most connected TL | Max degree among `roleKey = tl` |

---

## 6. URL filters (not separate queries)

| Param | Effect |
|-------|--------|
| `month` | Selected `yyyy-MM` — see §1 (rolling 12-month picker) |
| `category` | Scopes **edges** and per-node **activeProjects**; nodes still include anyone with any plan |
| `q` | Client-side focus on person name after load |

---

## 7. Debugging missing people

1. Run §2 SQL in Supabase for the anchor `month_date` + latest `snapshot_id` from §1.
2. Compare `COUNT(DISTINCT person_id)` to KPI **Active collaborators**.
3. If SQL count is higher: check category filter and role checkboxes (graph view only).
4. If SQL count is lower: ingestion / snapshot / `planned_hours` / PTO flags.

**Example (replace ids and date):**

```sql
SELECT COUNT(DISTINCT person_id) AS people_with_plans
FROM fact_plans
WHERE snapshot_id = '...'
  AND month_date = '2026-06-01'
  AND is_pto = false
  AND project_id IS NOT NULL
  AND planned_hours > 0;
```

---

## 8. Fragmentation (anchor month)

**Loader:** `lib/data/load-fragmentation-by-person.ts`  
**Table:** `fact_fragmentation` (same snapshot + `month_date` as the collaboration anchor month).

```http
GET /rest/v1/fact_fragmentation
  ?select=person_id,flagged,total_count
  &snapshot_id=eq.{snapshotId}
  &month_date=eq.{monthStartStr}
```

**SQL equivalent** (columns per `capacity-mcp/supabase/migrations/006_v2_schema.sql`):

```sql
SELECT person_id, flagged, total_count
FROM fact_fragmentation
WHERE snapshot_id = :snapshot_id
  AND month_date = :month_start_str;
```

The dashboard **does not** derive fragmentation labels. It displays:

| Node field | Source column |
|------------|---------------|
| `fragmentationFlagged` | `flagged` → **Fragmentation** row in UI (Yes / No) |
| `fragmentationTotalCount` | `total_count` (concurrent projects in the fact row) |

A future `fragmentation_level` (or similar) column may be added in capacity-mcp; wire it only after it exists in Supabase.

**Insights — “Highest fragmentation”:** person with the largest `total_count` among rows returned (numeric fact only).

**Project counts on nodes:**

| Field | Meaning |
|-------|---------|
| `totalProjects` | Distinct planned projects in the selected month (all categories) |
| `activeProjects` | Same, but only projects matching the `category` URL filter (graph edges / node size) |

---

## 9. Cache

`loadCollaborationGraphData` uses Next.js `'use cache'` with tag `overview-months` and `cacheLife({ stale: 120, revalidate: 300 })`. Cache key includes month slices + category + anchor month.

---

*Last updated: implementation uses `fact_plans` only for collaboration edges; see `load-collaboration-network.ts`.*
