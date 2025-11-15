# Aceras Check – Agent Instructions

This file is the quick-reference for Codex/Claude agents. Review `AGENT-WORKFLOW.md` for the full operating guide and `AGENTS.md` for persona bios.

## 1. How to Engage
- **Choose a persona** from `.agents/` (Planner, Developer, Reviewer) before making changes.
- **Read 1000–2000 lines** of relevant context (this file, `AGENT-WORKFLOW.md`, `thoughts/plans/`, source files) before editing.
- **Plan → Build → Review loop**:
  1. Planner prepares/updates `thoughts/plans/<feature>.md` with scope + verification.
  2. Developer executes each phase, updating plan status + noting test results.
  3. Reviewer validates work vs. plan, runs documented commands, and records findings.
- **Delete/refactor before adding** new code; match existing patterns and naming.

## 2. Documentation Map
- `AGENT-WORKFLOW.md` – detailed orchestrator rules & examples.
- `AGENTS.md` – persona summaries + links to `.agents/*.md`.
- `thoughts/plans/2025-11-12-prd.md` – canonical PRD.
- `thoughts/plans/2024-02-22-geosearch-photo.md` – current feature plan.
- `thoughts/research/` – exploratory notes (create as needed).
- `thoughts/issues/` – problem RCA logs.

## 3. Commands & Tooling
- `npm run dev` – Next.js dev server.
- `npm run lint` – ESLint via Next.js.
- `npm run build` – Production build (type-checks).
- `npm run test` – Add/execute when tests exist.
- Manual verifications: map interactions, Nominatim integration, InstantDB transactions.

## 4. Stack Snapshot
- Frontend: Next.js 14 (App Router), React, TailwindCSS.
- Maps: Leaflet + React-Leaflet + OpenStreetMap tiles.
- Data: InstantDB (schema in `src/instant.schema.ts`, db helper in `src/lib/db.ts`).
- Hosting target: Vercel.

## 5. Verification Expectations
- Run lint/build/tests whenever feasible; if skipped, document why in the plan or review notes.
- Test key flows manually (map load, geolocation, AddReport form, InstantDB writes, planned features).
- Keep diffs tight and reference the relevant plan section when opening PRs/hand-offs.

## 6. Cross-References
- For persona details read `AGENTS.md` → `.agents/*.md`.
- When using Claude IDE, supply this file plus the active plan; when using Codex CLI, follow `AGENT-WORKFLOW.md` + this document.
