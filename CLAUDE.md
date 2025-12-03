# CLAUDE.md

> Instructions and context for Claude Code working on this project.

---
## Project Config

```yaml
name: Aceras Check
description: Walkability reporting app with map-based pin dropping and photo uploads
stack: Next.js 15 (App Router + Turbopack), React 19, TailwindCSS, Leaflet, InstantDB, OpenAI
language: TypeScript
package_manager: npm
test_framework: Playwright (e2e)
hosting: Vercel
```

### Commands

| Task | Command |
|------|---------|
| Install | `npm install` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Test (e2e) | `npx playwright test` |
| Test (single) | `npx playwright test tests/<file>.spec.ts` |

### File Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   ├── page.tsx             # Main map page (~14k lines)
│   ├── layout.tsx           # Root layout with metadata
│   └── globals.css          # Tailwind base styles
├── components/
│   ├── MapView.tsx          # Leaflet map with OpenStreetMap
│   ├── AddReportForm.tsx    # Report submission form
│   ├── CameraCapture.tsx    # Webcam/photo capture
│   ├── PhotoQualityCheck.tsx
│   ├── AIAnalyzingScreen.tsx
│   ├── AIDraftReview.tsx    # OpenAI-powered draft review
│   ├── Header.tsx
│   ├── AuthModal.tsx        # InstantDB auth
│   ├── MyReports.tsx
│   └── WalkabilityPrototypeModal.tsx
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities (db.ts, etc.)
├── types/                   # TypeScript type definitions
├── instant.schema.ts        # InstantDB schema definition
└── instant.perms.ts         # InstantDB permissions
public/                      # Static assets (icons, images)
tests/                       # Playwright e2e specs
├── photo-upload.spec.ts
├── pin-drop-photo-flow.spec.ts
└── screenshots/             # Test artifacts
```

### Key Integrations

- **Maps:** Leaflet + React-Leaflet + OpenStreetMap tiles + Nominatim geocoding
- **Database:** InstantDB (real-time, schema in `instant.schema.ts`)
- **AI:** OpenAI API for draft analysis (`AIDraftReview.tsx`)
- **Images:** browser-image-compression for photo uploads
- **Animations:** Framer Motion

---
<!-- ⚠️ BELOW THIS LINE: Framework config — edit sparingly -->

## Coding Standards

### Naming Conventions
- **Functions/Variables:** camelCase
- **Components/Classes:** PascalCase
- **Constants:** UPPER_SNAKE_CASE
- **Files:** PascalCase for components, camelCase for utilities

### Code Style
- All components use `"use client"` directive (Next.js App Router)
- Functional components with hooks, no class components
- Props interfaces defined inline above component
- InstantDB accessed via `db` singleton from `src/lib/db.ts`
- Tailwind for styling (no CSS modules)
- Framer Motion for animations (`motion.div`, `AnimatePresence`)

## Boundaries

### ✅ Always
- Run lint and build before committing
- Test map interactions, Nominatim integration, InstantDB transactions manually
- Follow naming conventions above

### ⚠️ Ask First
- Adding new dependencies
- Modifying InstantDB schema
- Major refactors affecting multiple files

### 🚫 Never
- Commit secrets or API keys
- Modify `node_modules/` or lock files manually
- Remove failing tests without fixing the issue
- Push directly to `main`

---

## Agent Workflow

Use a three-phase approach for any non-trivial task:

### Phase 1: Research
- **Goal:** Understand relevant files, data flow, and root causes
- **Output:** `thoughts/shared/research/<issue-name>.md`
- **Use:** `/project:research <description>`

### Phase 2: Plan
- **Goal:** Create phased implementation plan with specific files and tests
- **Output:** `thoughts/shared/plans/<issue-name>.md`
- **Use:** `/project:plan <description>` (after research exists)

### Phase 3: Implement
- **Goal:** Execute plan with TDD — failing tests first, then fix
- **Use:** `/project:implement <plan-file>`

---

## Context Engineering

### Why This Matters
The context window is finite (200k tokens). Every tool call, file read, and message accumulates. Noisy context = worse outputs.

### Core Principles

1. **Target 50% context utilization** — Leave room for implementation
2. **Intentional compaction** — Write progress to markdown, then `/clear` and restart
3. **Sub-agents for exploration** — Offload noisy search/read operations to sub-agents so main context stays clean

### Sub-Agent Usage

Sub-agents are for **context control**, not role-play:

```
✅ Good sub-agent prompt:
"Find all files related to [feature]. Return:
- File paths with line numbers
- Key function names
- 1-sentence summary per file
Use only: Read, Glob, Grep. No Bash."

❌ Bad sub-agent prompt:
"You are a senior engineer. Please investigate..."
```

### Session Workflow for Complex Tasks

```
1. START
   └── Read CLAUDE.md + relevant research/plan file

2. WORK
   └── Execute one phase at a time
   └── Run tests frequently

3. CHECKPOINT (after each phase)
   └── Update plan file with: what's done, what failed, next steps

4. COMPACT (when context > 50% or getting noisy)
   └── Write progress summary to file
   └── /clear
   └── Start fresh: "Read [file] and continue Phase N"

5. DONE
   └── All tests pass
   └── Plan marked complete
```

### When Stuck

1. Stop — don't keep trying the same approach
2. Write current understanding to a progress file
3. `/clear`
4. Re-read problem + progress with fresh context
5. Try different approach or ask for clarification
