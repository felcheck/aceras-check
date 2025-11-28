# InstantDB Authentication + User Reports

> **Plan ID**: 2025-11-28-instant-auth
> **Branch**: `main`
> **Status**: Implementation Complete - Testing
> **Author**: Planner Agent
> **Last Updated**: 2025-11-28

---

## 0. Executive Summary

Add InstantDB's built-in authentication to:
1. Identify users via anonymous auth (auto-created on first visit)
2. Link reports to their author via existing `reportAuthor` schema link
3. Show user's own reports in a "Mis Reportes" section

**Goal**: Ensure report ownership and enable personalized views without requiring email/password signup.

---

## 1. Current State Analysis

### Authentication
- **No auth currently implemented** - reports created without author link
- Schema already has `reportAuthor` link defined (reports → $users)
- InstantDB supports anonymous auth out of the box

### Schema (already exists)
```typescript
// $users entity (built-in)
$users: i.entity({
  email: i.string().unique().indexed().optional(),
  imageURL: i.string().optional(),
  type: i.string().optional(),
})

// reportAuthor link (already defined)
reportAuthor: {
  forward: { on: "reports", has: "one", label: "author" },
  reverse: { on: "$users", has: "many", label: "reports" },
}
```

### Current Report Creation (page.tsx:123-162)
- Creates report without author link
- No user context available

---

## 2. Scope Definition

### In Scope (This Iteration)
- [x] Add email magic link auth (changed from anonymous per user request)
- [x] Link reports to authenticated user on creation
- [x] Add "Mis Reportes" view showing user's reports
- [x] Show auth state in header (login button / profile icon)

### Out of Scope (Future)
- Social login (Google, etc.)
- User profile editing
- Report deletion by author

---

## 3. Technical Approach

### InstantDB Anonymous Auth
InstantDB provides `db.auth.signInAnonymously()` which:
- Creates a new `$users` record automatically
- Persists across browser sessions via localStorage
- Returns user ID for linking data

### Auth Flow
```
App Load → Check auth state (db.useAuth())
  → If not signed in → signInAnonymously()
  → Store user in state
  → Use user.id when creating reports
```

---

## 4. Implementation Phases

### Phase 1: Add Auth Hook
**File**: `src/app/page.tsx`

1. Import and use `db.useAuth()` hook
2. Call `db.auth.signInAnonymously()` on mount if not authenticated
3. Pass user context to report creation

```typescript
// Add to App component
const { isLoading: authLoading, user, error: authError } = db.useAuth();

useEffect(() => {
  if (!authLoading && !user && !authError) {
    db.auth.signInAnonymously();
  }
}, [authLoading, user, authError]);
```

### Phase 2: Link Reports to Author
**File**: `src/app/page.tsx` - handleReviewSubmit

Update transaction to include author link:
```typescript
await db.transact([
  db.tx.reports[reportId].update({ ... }),
  db.tx.$files[photoId].update({ ... }),
  db.tx.reports[reportId].link({
    photos: photoId,
    author: user.id  // NEW: Link to authenticated user
  }),
]);
```

### Phase 3: Show User's Reports
**File**: `src/components/MyReports.tsx` (NEW)

Create a component to display user's reports:
- Query reports where author = current user
- Show as list with photo thumbnails
- Tap to view on map

**File**: `src/app/page.tsx`
- Add "Mis Reportes" button/tab in header or as floating action
- Toggle between map view and my reports view

---

## 5. File-by-File Changes

| File | Action | Key Changes |
|------|--------|-------------|
| `src/app/page.tsx` | MODIFY | Add useAuth, signInAnonymously, pass user to submit |
| `src/components/MyReports.tsx` | CREATE | List of user's reports |
| `src/components/Header.tsx` | MODIFY | Add user indicator / my reports button |

---

## 6. Verification Criteria

### Automated
- [x] `npm run lint` passes
- [x] `npm run build` succeeds

### Manual Testing
- [ ] User can enter email and receive magic code
- [ ] User can verify code and become authenticated
- [ ] Same user persists after page refresh
- [ ] New reports linked to user
- [ ] "Mis Reportes" shows only current user's reports
- [ ] Works on mobile (iOS Safari, Android Chrome)

---

## 7. API Reference

### db.useAuth()
```typescript
const { isLoading, user, error } = db.useAuth();
// user: { id: string, email?: string } | null
```

### db.auth.sendMagicCode() (used instead of anonymous)
```typescript
await db.auth.sendMagicCode({ email: "user@example.com" });
// Sends verification code to email
```

### db.auth.signInWithMagicCode()
```typescript
await db.auth.signInWithMagicCode({ email: "user@example.com", code: "123456" });
// Verifies code and signs in user
```

### Query user's reports
```typescript
const { data } = db.useQuery({
  reports: {
    $: { where: { "author.id": user.id } },
    photos: {},
  },
});
```

---

## 8. Implementation Summary

### Files Created
| File | Purpose |
|------|---------|
| `src/components/AuthModal.tsx` | Email magic link login modal with email input → code verification flow |
| `src/components/MyReports.tsx` | Full-screen list of user's reports with photo thumbnails |

### Files Modified
| File | Changes |
|------|---------|
| `src/app/page.tsx` | Added `db.useAuth()`, auth gating on camera start, author linking on submit |
| `src/components/Header.tsx` | Added login/logout buttons, My Reports icon, user avatar |

### Key Decisions
- **Magic link over anonymous**: User requested email auth to prevent spam and enable user identification
- **Auth required before camera**: User must be logged in to submit reports (spam protection)
- **Reports linked to author**: Using existing `reportAuthor` schema link

### Commit
```
24cf9b8 - Add email magic link authentication and My Reports view
```

---

*Plan created: 2025-11-28*
*Implementation completed: 2025-11-28*
