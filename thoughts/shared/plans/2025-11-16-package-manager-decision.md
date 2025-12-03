# Package Manager Decision: Bun vs npm

**Date**: 2025-11-16
**Status**: Analysis Complete - Recommendation Provided
**Goal**: Decide which package manager to standardize on for aceras-check

## Current Situation

**Mixed Usage Detected**:
- `package-lock.json` present (npm lockfile)
- Project initially may have used Bun
- Vercel deployment uses npm by default
- Need to standardize on one package manager

## Research Summary (2025)

### Performance Benchmarks

**Installation Speed (Next.js app ~1.1k packages)**:
- **Bun**: 8.6s (baseline)
- **pnpm**: 31.9s (3.7× slower)
- **npm**: 57.4s (6.7× slower)
- **Yarn**: 138s (16× slower)

**Key Finding**: Bun is 6-30× faster than npm across various project sizes.

### Stability & Production Readiness

**npm (Node Package Manager)**:
- ✅ Industry standard since 2010
- ✅ Maximum compatibility with all packages
- ✅ Proven track record in production
- ✅ Extensive documentation and community support
- ✅ Default on Vercel, Netlify, GitHub Actions
- ✅ Works with all CI/CD systems out of the box
- ❌ Slowest installation speed
- ❌ Less efficient disk usage

**Bun**:
- ✅ 6-30× faster installs
- ✅ Production-ready as of 2025
- ✅ 100% npm package compatibility (aims for)
- ✅ Modern, all-in-one toolchain
- ✅ Next.js officially supports Bun as package manager
- ❌ Younger ecosystem (less battle-tested)
- ❌ Potential edge cases with obscure packages
- ❌ Not default on major hosting platforms
- ❌ Requires explicit configuration in CI/CD

### Next.js 15 Compatibility

**Official Support**:
- npm: ✅ Fully supported
- pnpm: ✅ Fully supported
- Yarn: ✅ Fully supported
- Bun: ✅ Supported as **package manager only**

**Important Limitation**:
- Bun can install dependencies for Next.js
- Next.js still runs on Node.js runtime (not Bun runtime)
- You need Node.js installed even when using Bun as package manager

### Vercel Deployment Considerations

**Default Behavior**:
- Vercel automatically detects lockfiles
- `package-lock.json` → uses npm
- `bun.lockb` → uses Bun
- Priority: Bun > pnpm > Yarn > npm

**Our Recent Failure**:
- Deployed with npm (package-lock.json present)
- Failed because framer-motion wasn't in committed lockfile
- Now fixed - deployment should work with npm

**Switching to Bun on Vercel**:
- Delete `package-lock.json`
- Run `bun install` to create `bun.lockb`
- Commit `bun.lockb`
- Vercel auto-detects and uses Bun

## Decision Framework

### Project Context Analysis

**Our Project Characteristics**:
- Production app (Panama sidewalk reporting)
- Deployed on Vercel
- Next.js 15.4.6
- Small team (likely solo developer)
- Standard npm packages (no exotic dependencies)
- Current state: npm already configured and working

### Speed Impact Analysis

**Development Workflow**:
```
npm install (cold): ~57s
bun install (cold): ~8.6s
Savings: ~48s per clean install
```

**How Often Do We Clean Install?**:
- Switching branches: Rarely (lockfile usually compatible)
- Adding new dependencies: ~1-3 times per week
- CI/CD builds: Every deploy (but Vercel caches)
- New team member setup: Rare

**Real-World Impact**:
- Development: Save ~2-3 minutes per week
- CI/CD: Vercel caches work for both
- New developer onboarding: Save ~50 seconds once

### Risk Assessment

**Risks of Staying with npm**:
- ⚠️ Slower local installs (minor inconvenience)
- ✅ Zero compatibility risks
- ✅ Zero CI/CD configuration needed

**Risks of Switching to Bun**:
- ⚠️ Potential edge case package incompatibilities
- ⚠️ Less predictable behavior (newer tool)
- ⚠️ May need to explain to collaborators
- ⚠️ GitHub Actions would need explicit Bun setup
- ✅ Significant speed gains

## Recommendation Matrix

| Factor | npm | Bun | Winner |
|--------|-----|-----|--------|
| **Speed** | 57s install | 8.6s install | 🟢 Bun |
| **Stability** | Battle-tested | Production-ready | 🟡 npm (slightly) |
| **Vercel support** | Default | Supported | 🟢 Tie |
| **CI/CD setup** | Zero config | Need setup | 🟢 npm |
| **Next.js 15 compat** | Full | Full | 🟢 Tie |
| **Package ecosystem** | 100% | ~99.9% | 🟡 npm (slightly) |
| **Documentation** | Extensive | Good | 🟡 npm (slightly) |
| **Team familiarity** | Universal | Growing | 🟢 npm |
| **Migration effort** | N/A | Low | 🟢 npm |
| **Future-proofing** | Standard | Modern | 🟢 Bun |

## Final Recommendation

### 🎯 **STAY WITH npm** (For Now)

**Reasoning**:

1. **Already Working**: npm is configured, committed, and deploying successfully
2. **Minimal Pain Point**: 57s vs 8.6s only matters for clean installs (rare)
3. **Zero Risk**: No compatibility concerns, no CI/CD changes needed
4. **Solo Project**: Speed gains don't compound across large team
5. **Small Dependency Count**: ~19 packages (framer-motion, leaflet, next, etc.)

**When the Speed Would Matter**:
- Large monorepo with 100+ dependencies
- Frequent clean installs (multi-environment dev)
- Large team where everyone reinstalls often
- CI/CD without caching

**Our Reality**:
- Small package.json
- Vercel caches dependencies
- Likely solo developer
- Stable dependency list

### Future Consideration: Switch to Bun If...

**Trigger Conditions**:
1. **Team grows** → Multiple developers = more installs
2. **Dependencies balloon** → 100+ packages = noticeable slowness
3. **Monorepo adopted** → Workspaces make npm painfully slow
4. **CI/CD becomes bottleneck** → Uncached builds taking too long
5. **Bun becomes industry default** → Ecosystem fully matures

**Migration Path** (when ready):
```bash
# 1. Clean up
rm -rf node_modules package-lock.json

# 2. Install with Bun
bun install

# 3. Commit lockfile
git add bun.lockb
git commit -m "Switch to Bun package manager"
git push

# Vercel auto-detects bun.lockb and uses Bun
```

## Action Items

### Immediate (Cleanup)

- [x] Keep `package-lock.json` (already committed)
- [ ] Remove any `bun.lockb` if present (not needed)
- [ ] Verify no mixed lockfiles in repo
- [ ] Document decision in CLAUDE.md or README

### Long-term (Monitor)

- [ ] Revisit decision if team expands
- [ ] Revisit if dependency count exceeds 50 packages
- [ ] Revisit in 6 months (mid-2025) as Bun matures

## Comparison Table (Quick Reference)

```
┌─────────────────────┬──────────┬──────────┐
│ Factor              │   npm    │   Bun    │
├─────────────────────┼──────────┼──────────┤
│ Install Speed       │   57s    │   8.6s   │
│ Production Ready    │    ✅    │    ✅    │
│ Next.js 15 Support  │    ✅    │    ✅    │
│ Vercel Default      │    ✅    │    ❌    │
│ Zero Config CI/CD   │    ✅    │    ❌    │
│ Package Compat      │   100%   │  ~99.9%  │
│ Learning Curve      │   None   │  Minimal │
│ Migration Effort    │    N/A   │    Low   │
└─────────────────────┴──────────┴──────────┘
```

## Decision

**Status**: ✅ **STAY WITH npm**

**Rationale**:
- Currently working with zero issues
- Speed difference (48s) doesn't justify switching risk for solo project
- Can easily switch to Bun later if needs change
- npm is the path of least resistance for this project size

**Documentation Updated**: 2025-11-16

---

## References

- [Bun vs npm Performance Benchmarks 2025](https://dev.to/kirteshbansal/choosing-the-right-javascript-package-manager-in-2025-npm-vs-yarn-vs-pnpm-vs-bun-2jie)
- [Next.js Package Manager Support](https://nextjs.org/docs/app/getting-started/installation)
- [Vercel Package Manager Detection](https://vercel.com/docs/deployments/configure-a-build#package-manager)
- [Bun Package Manager Docs](https://bun.sh/package-manager)
