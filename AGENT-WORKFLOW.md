# Agent-Orchestrator Workflow Guide

## 0. Philosophy Shift
You are the Agent Orchestrator managing personas, rules, context, plans, and workflows.

## 1. System Architecture
```
project-root/
├── CLAUDE.md                # Project-specific AI instructions
├── AGENTS.md                # Root instructions for all agents (optional)
├── AGENT-WORKFLOW.md        # This file
├── .agents/                 # Persona definitions
│   ├── developer.md
│   ├── planner.md
│   ├── reviewer.md
│   └── (more if needed)
└── thoughts/
    ├── plans/               # Implementation plans
    ├── research/            # Discoveries + references
    └── issues/              # Bug RCAs, etc.
```

## 2. Core Workflow Loop
1. Persona Selection
2. Context Collection (read 1000-2000 lines)
3. Planning Phase
4. Execution Phase
5. Verification Phase
6. Documentation Phase
7. Commit Phase

## 3. Personas
- **Developer Agent**
  - Role: Implement & refactor code
  - Rules: Read first, delete more than add, follow patterns, commit frequently
- **Planner Agent**
  - Role: Write scoped plans
  - Rules: Analyze current state, specify out-of-scope, define verification criteria
- **Reviewer Agent**
  - Role: Review diffs
  - Rules: Align with plan, cover edge cases, enforce performance/architecture constraints

## 4. CLAUDE.md Structure
At the repo root, describe:
- Mandatory persona selection
- Core principles (read first, delete/refactor before adding, use existing patterns)
- Project context (Next.js + InstantDB stack, commands, notes)
- Common commands (dev server, lint/test/build)
- Documentation location rules (thoughts/, .agents/)

## 5. Planning Documents (`thoughts/plans/<feature>.md`)
Each plan includes:
- Overview & goals
- Current state summary
- What we are NOT doing
- Implementation phases
- File-by-file changes
- Verification criteria (automated + manual)
- Optional: Sub-agent delegation/owners

## 6. Execution Rules (Developer Agent)
- Read 1000-2000 lines before editing
- Delete/refactor first, minimize new code
- Follow current architecture/naming patterns
- Commit every 5-15 minutes or per vertical slice

## 7. Verification Rules (Reviewer Agent)
- Run lint/test/build commands when relevant
- Review diffs for edge cases, architecture violations, omissions
- Document issues and open questions

## 8. Documentation Rules
- Store artifacts in `thoughts/`
  - Plans → `thoughts/plans/`
  - Research → `thoughts/research/`
  - Issues/RCAs → `thoughts/issues/`
- Maintain `thoughts/takeaways.md` for cumulative lessons (create on demand)

## 9. Practical Setup Checklist
- [x] Create `.agents/` folder and persona files
- [x] Create `thoughts/` hierarchy
- [ ] Keep CLAUDE.md updated with personas & workflow summary
- [ ] Maintain current plans + research docs

## 10. Codex CLI Usage
- Install via npm: `npm install -g @openai/codex`
- Or brew: `brew install codex`
- Run `codex` in project root to start interactive sessions

## 11. Next Actions
1. Update `CLAUDE.md` with persona + workflow expectations
2. Document the next feature plan under `thoughts/plans/`
3. Launch `codex` CLI and run the workflow loop
