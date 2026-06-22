# Architecture Audit — capacity-dashboard

**Date:** 2026-06-09  
**Scope:** Full codebase scan — structure, patterns, documentation, UI/UX consistency, data access  
**Auditor role:** Frontend architect / UX-UI

---

## Executive Summary

The project is a well-structured Phase 1 implementation of a read-only workforce intelligence dashboard built on Next.js 16, TypeScript, Tailwind CSS 4, and Supabase. The overall architecture is sound: data tier separation is clear, the RSC/client boundary is respected, and the design system is coherent. However, several structural antipatterns have accumulated as the codebase grew section by section without cross-section abstraction. The most impactful issues are a family of near-identical boilerplate files replicated per domain section, one explicit CLAUDE.md contract violation, and a set of documentation inconsistencies that create ambiguity for future contributors.

**Priority matrix:**

| Severity | Count | Examples |
|---|---|---|
| Critical (contract violation or DRY break > 3x) | 3 | `components/dashboard/`, tripled `RoutePendingShell`, duplicated bar chart |
| Moderate (DRY break 2x, inconsistent UX, missing structure) | 5 | `DataError` inconsistency, `MonthPicker` wrappers, missing `lib/people/`, `capacity-kpi-contract.ts` placement |
| Low (naming, minor inconsistency, stale docs) | 6 | redirect destination mismatch, `coming-soon` API divergence, `perf-log.ts` lifecycle |

---

## Critical Findings

### C-1 — `components/dashboard/` violates CLAUDE.md

**File:** [components/dashboard/kpi-metric-card.tsx](../components/dashboard/kpi-metric-card.tsx)

CLAUDE.md states explicitly:

> *"Do not create `components/dashboard/` or any other catch-all folder — reusable UI primitives belong in `components/ui/`."*

`KpiMetricCard`, `KpiMetricSubline`, and `KPI_METRICS_GRID_CLASS` live in `components/dashboard/` and are imported by 7 components across 4 sections:

| Consumer |
|---|
| [components/capacity/overview/capacity-overview-kpi-section.tsx](../components/capacity/overview/capacity-overview-kpi-section.tsx) |
| [components/capacity/utilization/utilization-kpi-section.tsx](../components/capacity/utilization/utilization-kpi-section.tsx) |
| [components/overview/overview-headline-parts.tsx](../components/overview/overview-headline-parts.tsx) |
| [components/projects/_shared/projects-section-skeletons.tsx](../components/projects/_shared/projects-section-skeletons.tsx) |
| [components/projects/overview/projects-overview-kpi-section.tsx](../components/projects/overview/projects-overview-kpi-section.tsx) |
| [components/teams/collaboration/collaboration-kpi-row.tsx](../components/teams/collaboration/collaboration-kpi-row.tsx) |
| [components/teams/overview/teams-overview-kpi-section.tsx](../components/teams/overview/teams-overview-kpi-section.tsx) |

**Fix:** Move to `components/ui/kpi-metric-card.tsx`. Update all 7 import paths.

---

### C-2 — `*RoutePendingShell` tripled — 99% identical boilerplate

Three files implement the exact same React context + `useTransition` + router pattern, differing only in name prefix:

| File | Type name | Context |
|---|---|---|
| [components/capacity/_shared/capacity-route-pending-shell.tsx](../components/capacity/_shared/capacity-route-pending-shell.tsx) | `CapacityRoutePendingValue` | `CapacityRoutePendingContext` |
| [components/teams/_shared/teams-route-pending-shell.tsx](../components/teams/_shared/teams-route-pending-shell.tsx) | `TeamsRoutePendingValue` | `TeamsRoutePendingContext` |
| [components/projects/_shared/projects-route-pending-shell.tsx](../components/projects/_shared/projects-route-pending-shell.tsx) | `ProjectsRoutePendingValue` | `ProjectsRoutePendingContext` |

Each is ~50 lines. All three render identical JSX:
```tsx
<div className="flex min-h-[50vh] flex-col gap-8" aria-busy={isPending} aria-live="polite">
  {children}
</div>
```

The companion `*RouteSection` components (capacity, teams) are also identical — they just import different hooks. And the `*MonthPicker` wrappers (capacity, teams) are identical thin wrappers around `OverviewMonthPicker`.

**Pattern:** Every new section currently requires copy-pasting 3 files with name substitution. Adding a People or Insights section means 3 more copies.

**Fix:** Extract a generic `createSectionPendingContext()` factory or a single `SectionRoutePendingShell` that accepts a `label` for context disambiguation. Move to `components/ui/section-route-pending-shell.tsx` (or `lib/ui/`). All section-specific variants collapse into thin re-exports or direct usage.

---

### C-3 — Distribution bar chart duplicated between sections

The horizontal headcount bar chart (label column + bar + axis ticks at bottom) is implemented twice with near-identical logic:

| File | Component | Context |
|---|---|---|
| [components/capacity/utilization/utilization-analytics-grid.tsx:17](../components/capacity/utilization/utilization-analytics-grid.tsx) | `HeadcountByRoleHorizontalChart` | Capacity utilization |
| [components/teams/overview/teams-distribution-chart.tsx](../components/teams/overview/teams-distribution-chart.tsx) | `TeamsDistributionChart` | Teams overview |

Shared logic (verbatim or trivially renamed):
- `domainMax` ceiling: `Math.max(5, Math.ceil(max / 5) * 5)`
- Tick generation: `Array.from({ length: domainMax / tickStep + 1 }, (_, i) => i * tickStep)`
- Bar width: `Math.min(100, (value / domainMax) * 100)`
- Inline style `gridTemplateColumns: 'minmax(11rem, 34%) minmax(0, 1fr)'` appears **4 times** across both files
- Identical bottom axis row (monospace ticks with `border-t border-border/60`)

The two differ only in: data type (`RoleAnalyticsRow` vs `TeamsDistributionRow`), aria label, and color token (`bg-team-headcount-bar` in both — so actually the same).

**Fix:** Extract `components/ui/headcount-bar-chart.tsx` accepting `rows: { id?: string; key?: string; label: string; headcount: number; sharePct: number }[]` and generic `ariaLabel`. Both callers delegate to this primitive. The grid template value becomes a CSS custom property or a named Tailwind container class to avoid the repeated inline style.

---

## Moderate Findings

### M-1 — `*DataError` / `*EmptyMonths` — tripled with visual inconsistency

Three section-specific error components exist with different styling:

| Component | Styling |
|---|---|
| `CapacityDataError` | `rounded-lg border border-destructive/30 bg-destructive/5` |
| `TeamsDataError` | **Identical** to `CapacityDataError` |
| `ProjectsDataError` | `dashboardSurfaceClass()` + `role="alert"` — adds accessibility attribute missing from the other two |

`CapacityEmptyMonths` and `TeamsEmptyMonths` are character-for-character identical.  
`ProjectsEmptyMonths` uses `dashboardSurfaceClass()` instead of raw border classes.

This means the error UX is inconsistent across sections (Projects has `role="alert"`, the others don't), and Projects uses a different visual surface.

**Fix:** Single `SectionDataError` and `SectionEmptyState` in `components/ui/` with `role="alert"`, using `dashboardSurfaceClass()` consistently. Remove all three duplicates. The section-specific `EmptyMonths` copies with identical copy should be replaced with a shared one that accepts an optional `message` prop.

---

### M-2 — `capacity-kpi-contract.ts` is in the wrong tier

**File:** [lib/overview/capacity-kpi-contract.ts](../lib/overview/capacity-kpi-contract.ts)

CLAUDE.md states:

> *"KPI contracts (e.g. `capacity-kpi-contract.ts`) belong in `lib/domain/` — they are cross-section definitions, not section-specific."*

This file lives in `lib/overview/`, which is a section data-layer folder (tier 2). A contract definition is a pure formula with no I/O — it belongs in `lib/domain/` (tier 1).

**Fix:** Move to `lib/domain/capacity-kpi-contract.ts`. Update imports in any consuming loaders.

---

### M-3 — `lib/people/` and `components/people/` do not exist

The People section has 6 routes under `app/(dashboard)/people/` (all currently placeholders per SP-3 deferred). However:

- There is no `lib/people/` directory — every other active section has one
- There is no `components/people/` directory — every other section (including those with unshipped sub-routes) has a `components/<section>/` with at least a `_shared/` folder

When SP-3 resumes, the contributing developer will have no structural template to follow. The absence also breaks the folder-mirroring convention documented in CLAUDE.md.

**Fix:** Create `components/people/_shared/` with stub files (`people-route-pending-shell.tsx`, `people-data-error.tsx`, `people-section-skeletons.tsx`) to establish the section skeleton ahead of implementation. This also becomes the first consumer of the unified primitives from C-2 and M-1.

---

### M-4 — `coming-soon` placeholder API diverges between sections

| Component | Props | Usage context |
|---|---|---|
| `CapacityComingSoon` | `{ href: string }` — resolves label/description from nav catalog | Full-page placeholder with header + dashed box |
| `TeamsComingSoonCard` | `{ title: string; description: string }` — explicit strings | Card-sized block, used inline among other cards |

These serve different visual contexts (page-level vs card-level), which is reasonable. However:
- Naming is inconsistent: one has a `Card` suffix, one doesn't
- `CapacityComingSoon` couples itself to the navigation catalog; `TeamsComingSoonCard` is self-contained
- The `data-slot` values are different (`capacity-coming-soon` vs `teams-coming-soon-card`), making it harder to target with shared parent selectors

**Fix:** Keep both components since they serve different layouts, but align the naming convention: `CapacityComingSoon` → `CapacityComingSoonPage`, `TeamsComingSoonCard` stays as is. Document the two slots in CLAUDE.md under component authoring.

---

### M-5 — `*MonthPicker` wrappers add a file per section for minimal logic

`CapacityMonthPicker` and `TeamsMonthPicker` are 20-line wrappers around `OverviewMonthPicker`. Their only difference is which `usePendingShell` hook they call. If C-2 is resolved (unified `RoutePendingShell`), these wrappers dissolve — callers can pass `useSectionRoutePending()` directly.

If C-2 is not addressed first, the current wrappers are acceptable, but a People/Insights section would add a third copy.

**Fix:** Resolve C-2 first. Then collapse both month picker wrappers into direct `OverviewMonthPicker` usage with the unified pending context.

---

## Low-Priority / Minor Findings

### L-1 — `/team` redirect destination documented incorrectly in CLAUDE.md

**Code:** `next.config.ts` line 10 — `/team` → `/capacity/utilization` (permanent)  
**CLAUDE.md:** *"| `/team` | Redirect → `/teams` |"*

The redirect goes to Capacity Utilization, not to the Teams section. The code behavior is intentional (legacy alias for the old `/team` dashboard), but CLAUDE.md documents the wrong destination.

**Fix:** Update CLAUDE.md routes table to show `/team` → `/capacity/utilization`.

---

### L-2 — `lib/dev/perf-log.ts` has no lifecycle documentation

A performance logging utility exists in `lib/dev/`. It is not mentioned in CLAUDE.md, no docs describe when it is used, whether it is stripped in production builds, or who should call it. Without this, contributors cannot judge whether it is safe to add new calls or whether it should be removed.

**Fix:** Add a one-line entry to CLAUDE.md under "Code organisation → lib/" describing what `lib/dev/` is and whether it is development-only.

---

### L-3 — `section-placeholder.tsx` vs `section-route-placeholder.tsx` distinction is undocumented

Two similarly named files exist in `components/layout/`. Their different use cases are not described anywhere. A contributor encountering both cannot decide which to use without reading both.

**Fix:** Add a comment to each file (or a CLAUDE.md note) clarifying the distinction — e.g. one for full-page unbuilt sections, one for sub-route shells inside a built section.

---

### L-4 — PROJECT_STATUS.md does not reflect Teams Collaboration

The git log shows `Merge branch 'feature/teams-collaboration-network'` is already merged (commit `ee981de`). The `docs/PROJECT_STATUS.md` Parallel Work table shows Teams Composition as "Done" but does not list Collaboration Network as a shipped track.

**Fix:** Update `PROJECT_STATUS.md` to add `SP-4.3 Teams Collaboration` as "Done".

---

### L-5 — CLAUDE.md navigation config file names may be stale

CLAUDE.md references:
- `lib/navigation/section-nav-config.ts`  
- `lib/navigation/sidebar-nav-config.ts`

The actual files are `navigation-catalog.ts`, `search-navigation.ts`, `shipped-routes.ts`. The file names in CLAUDE.md do not match what exists on disk.

**Fix:** Update the navigation config references in CLAUDE.md to the actual file names.

---

### L-6 — SP-3 People deferral not noted in CLAUDE.md

`PROJECT_STATUS.md` states SP-3 People is deferred. CLAUDE.md describes the People section with route targets but gives no indication it is out of scope for the current phase. A contributor reading CLAUDE.md alone would believe People is active work.

**Fix:** Add a note to the Navigation table in CLAUDE.md: *"SP-3 People — deferred; sub-sections are stubs."*

---

## Documentation Health

| Doc | Currency | Issue |
|---|---|---|
| `CLAUDE.md` | Moderate | 4 inaccuracies: redirect destination, file names, KPI contract placement, SP-3 status |
| `PROJECT_STATUS.md` | Slightly stale | Missing collaboration network as shipped; `SP-2.6 Bench` still "Not started" (verify) |
| `PLAN_MASTER.md` | Structural | Phase tracking split across 3 files creates 3 sources of truth — PROJECT_STATUS.md should remain the single resume point |
| `COLLABORATION_NETWORK_*.md` | Current | Well maintained |
| `PERFORMANCE_BENCHMARK.md` | Baseline | No date — unclear if measurements are current or from initial setup |

---

## Inline Styles Inventory

22 instances of `style={{}}` across the codebase. All are justified (dynamic values not expressible in Tailwind). The most significant candidates for extraction:

| Pattern | Files | Suggested fix |
|---|---|---|
| `gridTemplateColumns: 'minmax(11rem, 34%) minmax(0, 1fr)'` | `utilization-analytics-grid.tsx` (×2), `teams-distribution-chart.tsx` (×2) | CSS custom property or Tailwind `[grid-template-columns:...]` utility — resolves with C-3 extraction |
| `paddingLeft: \`${depth * 0.75}rem\`` | `planning-tree-grid-utils.tsx` | Justified — tree indentation must be computed |
| Progress bar `width: \`${pct}%\`` | `planned-logged-progress-bar.tsx`, `utilization-analytics-grid.tsx`, `teams-distribution-chart.tsx` | Justified — computed from data; resolved by bar chart extraction in C-3 |
| `color: \`var(${cssVar})\`` | `overview-headline-parts.tsx`, `kpi-metric-card.tsx` | Justified — dynamic CSS variable name from data config |
| Sidebar width via CSS vars | `sidebar.tsx` | Justified — CSS variable transition pattern |

No hardcoded color literals or spacing values found outside CSS custom properties.

---

## Strengths (for balance)

The following patterns are well-executed and should be preserved:

- **Tier separation in `lib/`** is clean. Pure formulas in `lib/domain/`, loaders in section folders, infrastructure in dedicated sub-trees. No business logic leaking into components.
- **`'use cache'` placement** is consistent. Cache is applied at the loader level with appropriate `cacheLife()` profiles, not in components or pages. Cache tags are centralized in `lib/data/cache-tags.ts`.
- **RSC boundaries** are well-managed. Pages are Server Components; `'use client'` appears only where interactivity requires it. The sidebar collapse pattern (CSS-variable-driven width, client context, server children) is the correct approach.
- **Design system discipline** is strict. All colors via CSS custom properties (oklch), no hardcoded values, no font imports outside Inter/JetBrains Mono, no decorative elements. The monochromatic palette is consistent across all section components.
- **TanStack Table usage** is standardized via `components/ui/data-table/` shared primitives. No ad-hoc table implementations found.
- **Snapshot pattern** is consistently applied. All fact queries resolve the latest `sync_snapshot` first; no hard-coded snapshot IDs.
- **No dead code, no TODO markers.** The codebase is clean.

---

## Prioritized Action Plan

### Phase A — Structural fixes (before next section is built)

| Priority | Action | Effort | Risk |
|---|---|---|---|
| A-1 | Move `kpi-metric-card.tsx` to `components/ui/` (C-1) | Low — update 7 imports | Zero functional risk |
| A-2 | Extract generic `RoutePendingShell` factory (C-2) | Medium — refactor 3 shells + 2 route-sections + 2 month-pickers | Functional risk: test filter navigation in each section |
| A-3 | Extract `HeadcountBarChart` to `components/ui/` (C-3) | Medium — new component + update 2 callers | Low — pure UI extraction |
| A-4 | Unify `*DataError` / `*EmptyMonths` to `components/ui/` (M-1) | Low — 3 small components → 1 | Zero functional risk |
| A-5 | Move `capacity-kpi-contract.ts` to `lib/domain/` (M-2) | Low — move file + update imports | Zero functional risk |

### Phase B — Structural scaffolding (before SP-3 People starts)

| Priority | Action | Effort |
|---|---|---|
| B-1 | Create `components/people/_shared/` stubs (M-3) | Trivial |
| B-2 | Create `lib/people/` with README stub (M-3) | Trivial |

### Phase C — Documentation cleanup (continuous)

| Priority | Action |
|---|---|
| C-1 | Fix CLAUDE.md: redirect destination, file names, KPI contract placement, SP-3 note (L-1, L-5, L-6, M-2) |
| C-2 | Update PROJECT_STATUS.md: add collaboration network as shipped (L-4) |
| C-3 | Add `lib/dev/` lifecycle note to CLAUDE.md (L-2) |
| C-4 | Clarify `section-placeholder` vs `section-route-placeholder` (L-3) |
| C-5 | Align `coming-soon` naming convention (M-4) |

---

*Audit performed on codebase state at commit `e7b1c0c` (2026-06-09).*
