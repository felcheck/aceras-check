# Drawer UX Polish Plan

**Date**: 2025-11-16
**Status**: Planning
**Goal**: Polish the drawer component with improved UX, proper accordions, and consistent naming

## Current Issues to Address

1. **Naming**: Component called "WalkabilityPrototypeModal" - should remove "Prototype"
2. **Close behavior**: Dragging down completely closes drawer - should only collapse to preview state
3. **Cancel button**: Generic "Cancelar" button - should be consistent "X" icon in both states
4. **Call-to-action**: Says "Reportar Problema Aquí" - should say "Chequear Acera Aquí"
5. **Form title**: No title when drawer is expanded - needs "Nuevo Chequeo de Acera"
6. **Accordion design**: Card-like with triangles - should be proper accordions with chevrons
7. **Section order**: May not follow logical intake order (SEGURIDAD first)

## Research Findings: Accordion UX Best Practices

### Icon & Position (Nielsen Norman Group + UX Movement)

**Icon Choice**:
- ✅ **Chevron/Caret** is safest and most predictable
- Down chevron (▼) = collapsed state
- Up chevron (▲) = expanded state
- Alternative: Plus (+) → Minus (−) also tested well

**Icon Position Debate**:
- **Left position**: 90% of users predicted menu would change, fastest task completion
- **Right position**: Nielsen Norman Group standard, clear visual cue after reading header
- **Verdict**: Right position is more common in 2025, especially for forms

### Best Practices Summary

**Visual Design**:
- Outlined chevron (not filled triangle)
- Position chevron on the right side
- Point down when collapsed (▼), up when expanded (▲)
- Make entire header clickable (not just icon)
- Add hover effect to indicate clickability

**Accessibility Requirements**:
- Use `<button>` element for headers
- Include `aria-expanded="true|false"`
- Apply `hidden` attribute to collapsed panels
- Ensure keyboard navigation (Enter/Space to toggle)
- Minimum 44px tap target for mobile

**Animation**:
- Smooth transitions (~300ms, ease-in-out)
- Collapsed panels should have `display: none` or `hidden` for screen readers
- Keep expanded items open until user closes (no auto-collapse)

**Mobile Considerations**:
- Headers should be 56px minimum for easy thumb taps
- Entire header row is tappable (not just icon)
- Avoid horizontal scrolling

## Logical Section Order (from Intake Criteria Plan)

**Priority Order**:
1. **SEGURIDAD** (5 points) - Core mission, highest priority
2. **UTILIDAD** (1 point) - High civic value
3. **COMODIDAD** (2 points) - Medium priority
4. **INTERESANTE** (2 points) - Storytelling/vibes

**Rationale**: SEGURIDAD first because it's the core safety mission and has highest point value (5/10 total).

## Detailed Changes Plan

### 1. Rename Component ✓

**Files to Update**:
- `src/components/WalkabilityPrototypeModal.tsx` → Keep filename for git history
- Internal naming: Update component name, comments, props interface

**Change**:
```typescript
// Before: export default function WalkabilityPrototypeModal(...)
// After:  export default function WalkabilityDrawer(...)
```

**Impact**: Low effort, high clarity

---

### 2. Fix Close Behavior (Drag to Collapse, Not Close) ✓

**Current Behavior**:
- Dragging down from expanded → calls `onClose()` → removes drawer completely

**Desired Behavior**:
- Dragging down from expanded → returns to collapsed state (shows location preview)
- Only the "X" button should fully close the drawer

**Implementation**:
```typescript
// In handlePanEnd for expanded → collapsed transition:
// Before:
if (velocity > 600 || dragRatio > 0.25) {
  setDrawerState('collapsed');
  onClose(); // ❌ This removes drawer
}

// After:
if (velocity > 600 || dragRatio > 0.25) {
  setDrawerState('collapsed');
  // Don't call onClose() - just collapse
}
```

**New Close Logic**:
- Dragging down from expanded → collapse only
- Clicking "X" button → calls `onClose()` → removes drawer completely
- Clicking backdrop → same as "X" (close completely)

**Impact**: Medium effort, improves UX consistency

---

### 3. Replace "Cancelar" with Consistent "X" Icon ✓

**Current State**:
- Collapsed: "Cancelar" button (text)
- Expanded: No visible close button

**Desired State**:
- Collapsed: "X" icon button (top-right)
- Expanded: "X" icon button (top-right, same position)

**Visual Design**:
```tsx
{/* Top-right close button - both states */}
<button
  onClick={() => {
    setDrawerState('collapsed');
    onClose();
  }}
  className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
  aria-label="Cerrar"
>
  <svg className="w-5 h-5 text-gray-500" /* X icon SVG */ />
</button>
```

**Position**: Fixed top-right corner, visible in both collapsed and expanded states

**Impact**: Low effort, high consistency

---

### 4. Update CTA Text: "Chequear Acera Aquí" ✓

**Current**: "Reportar Problema Aquí"
**New**: "Chequear Acera Aquí"

**Rationale**:
- "Chequear" is more neutral than "Reportar Problema"
- This is a walkability assessment, not just problem reporting
- Aligns with positive framing (checking quality, not just complaining)

**Change**:
```tsx
// Collapsed state button
<button className="flex-1 bg-blue-600...">
  Chequear Acera Aquí
</button>
```

**Impact**: Trivial effort, better framing

---

### 5. Add Form Title When Expanded ✓

**Current**: No title when drawer opens to expanded state

**Desired**:
```tsx
{/* Expanded state header */}
{drawerState === 'expanded' && (
  <div className="px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700">
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
      Nuevo Chequeo de Acera
    </h2>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      {location.addressLabel || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
    </p>
  </div>
)}
```

**Position**: Top of expanded drawer, below drag handle and close button

**Impact**: Low effort, improves context

---

### 6. Replace Card-like Accordions with Proper Accordions ✓

**Current Design**:
- Card appearance with shadow/border
- Triangle icons (▶)
- Icon position unclear
- Unknown default open state

**New Design** (Research-backed):

```tsx
{/* Accordion Section */}
<div className="border-b border-gray-200 dark:border-gray-700">
  <button
    onClick={() => toggleBucket('seguridad')}
    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    aria-expanded={openBuckets.seguridad}
  >
    {/* Left: Icon + Label + Score */}
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        🛡️
      </div>
      <div className="text-left">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          SEGURIDAD
        </h3>
        <p className="text-xs text-gray-500">
          {scores.seguridad.toFixed(1)} / 5.0
        </p>
      </div>
    </div>

    {/* Right: Chevron */}
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform ${
        openBuckets.seguridad ? 'rotate-180' : ''
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {/* Panel */}
  <div
    hidden={!openBuckets.seguridad}
    className="px-6 py-4 bg-gray-50 dark:bg-gray-900"
  >
    {/* Form fields for SEGURIDAD */}
  </div>
</div>
```

**Key Changes**:
- No card shadow/border (just bottom border separator)
- Chevron on the right (outlined stroke)
- Chevron rotates 180° when expanded (always points down, flips to up)
- Entire header is clickable button
- `aria-expanded` for accessibility
- `hidden` attribute on collapsed panels
- 56px min height for mobile taps
- Hover effect on header

**Default State** (NEW REQUIREMENT):
```tsx
// All sections open on first drawer open
const [openBuckets, setOpenBuckets] = useState<Record<BucketId, boolean>>({
  seguridad: true,    // Open by default
  utilidad: true,     // Open by default
  comodidad: true,    // Open by default
  interesante: true,  // Open by default
});
```

**Rationale**:
- Forms should show all fields immediately (don't hide content)
- User shouldn't have to hunt for what to fill
- Reduces interaction cost (no expand required)
- Accordions still useful for collapsing after filling
- Even fields with impossible null values should be visible (better UX)

**Impact**: Medium effort, major UX improvement

---

### 7. Reorder Sections to Match Intake Priority ✓

**Current Order** (unknown, need to check):
```
?
```

**Correct Order** (from intake criteria plan):
```tsx
const BUCKET_ORDER: BucketId[] = [
  'seguridad',   // 1st - Core mission (5 points)
  'utilidad',    // 2nd - High civic value (1 point)
  'comodidad',   // 3rd - Medium priority (2 points)
  'interesante'  // 4th - Storytelling (2 points)
];
```

**Rendering**:
```tsx
{BUCKET_ORDER.map((bucket) => (
  <AccordionSection
    key={bucket}
    bucket={bucket}
    isOpen={openBuckets[bucket]}
    onToggle={() => toggleBucket(bucket)}
    // ...
  />
))}
```

**Impact**: Trivial effort, aligns with product priorities

---

## Implementation Phases

### Phase 1: Quick Wins (30 minutes)
- [x] Research accordion UX best practices
- [ ] Rename component (internal only, keep filename)
- [ ] Update CTA text: "Chequear Acera Aquí"
- [ ] Add form title "Nuevo Chequeo de Acera"
- [ ] Reorder sections (SEGURIDAD first)

### Phase 2: Close Behavior (30 minutes)
- [ ] Update drag-to-close logic (collapse instead of close)
- [ ] Add "X" button to collapsed state
- [ ] Ensure "X" button visible in expanded state
- [ ] Update backdrop click (close completely)

### Phase 3: Accordion Redesign (1 hour)
- [ ] Set all sections to open by default (`openBuckets` all `true`)
- [ ] Replace card styling with border-bottom separators
- [ ] Replace triangles with chevron icons
- [ ] Position chevrons on the right
- [ ] Add rotation animation (180° flip)
- [ ] Make entire header clickable
- [ ] Add hover effects
- [ ] Add `aria-expanded` and `hidden` attributes
- [ ] Test keyboard navigation (Enter/Space)

### Phase 4: Polish (30 minutes)
- [ ] Test on mobile (tap targets ≥44px)
- [ ] Verify dark mode appearance
- [ ] Smooth animations (~300ms)
- [ ] Accessibility audit (screen reader testing)

---

## Visual Mockup: Before & After

### Before (Current)
```
┌─────────────────────────────────────┐
│ 🔹 Drag handle                      │
│                                     │
│ 📍 Calle 50, Panama City          │
│ 8.983333, -79.516670               │
│                                     │
│ ┌─────────────────────────────┐   │
│ │ ▶ SEGURIDAD       3.5 / 5.0 │   │ ← Card with triangle
│ └─────────────────────────────┘   │
│ ┌─────────────────────────────┐   │
│ │ ▼ UTILIDAD        0.0 / 1.0 │   │ ← Opened (triangle flipped)
│ │   [Form fields here...]      │   │
│ └─────────────────────────────┘   │
│                                     │
│ [Reportar Problema Aquí] [Cancelar]│
└─────────────────────────────────────┘
```

### After (Proposed)
```
┌─────────────────────────────────────┐
│ 🔹 Drag handle              [X]    │ ← X icon always visible
│                                     │
│ Nuevo Chequeo de Acera             │ ← Title added
│ 📍 Calle 50, Panama City          │
│                                     │
├─────────────────────────────────────┤
│ 🛡️  SEGURIDAD         0.0/5.0  ▲  │ ← All open by default
│                                     │
│ ¿Existe la acera? [Sí] [No]       │
│ Ancho: ☆☆☆☆☆                      │
│ [More form fields...]              │
│                                     │
├─────────────────────────────────────┤
│ 🎯  UTILIDAD          0.0/1.0  ▲  │ ← All expanded on first open
│                                     │
│ Parque cercano: [ ] Sí             │
│ Supermercado: [ ] Sí               │
│ [More amenities...]                │
│                                     │
├─────────────────────────────────────┤
│ 🌳  COMODIDAD         0.0/2.0  ▲  │
│                                     │
│ Sombra: ☆☆☆☆☆                     │
│ [More fields...]                   │
│                                     │
├─────────────────────────────────────┤
│ ⭐  INTERESANTE       0.0/2.0  ▲  │
│                                     │
│ ¿Comercios? [Sí] [No]              │
│ Vibras: ☆☆☆☆☆                     │
│                                     │
└─────────────────────────────────────┘
```

---

## Accordion Icon SVG

**Chevron Down** (collapsed state):
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
</svg>
```

**Animation** (CSS):
```tsx
className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
```

When `rotate-180` is applied, chevron points up (expanded state).

---

## Accessibility Checklist

- [ ] `<button>` elements for accordion headers
- [ ] `aria-expanded="true|false"` on headers
- [ ] `hidden` attribute on collapsed panels
- [ ] Keyboard navigation: Enter/Space toggles
- [ ] Tab order: Handle → Close → Accordions → Form fields
- [ ] Focus indicators visible
- [ ] Screen reader announces "button, collapsed/expanded"
- [ ] Color contrast meets WCAG AA (3:1 for icons)
- [ ] Touch targets ≥44px on mobile

---

## Success Criteria

**Functional**:
- ✅ Dragging down collapses (doesn't close)
- ✅ "X" button closes completely
- ✅ Accordions use chevrons on right side
- ✅ Chevron rotates 180° when toggled
- ✅ SEGURIDAD appears first
- ✅ Form title visible when expanded

**UX**:
- ✅ Entire accordion header is clickable
- ✅ Hover effect provides feedback
- ✅ Animations smooth (~300ms)
- ✅ No confusion about close vs. collapse

**Accessibility**:
- ✅ Screen reader announces state correctly
- ✅ Keyboard navigation works
- ✅ Touch targets large enough
- ✅ Focus indicators visible

---

## Files to Modify

1. **`src/components/WalkabilityPrototypeModal.tsx`** (main component)
   - Rename internal references
   - Update close behavior logic
   - Add "X" button component
   - Redesign accordion headers
   - Reorder sections by priority
   - Add form title

2. **`src/app/page.tsx`** (parent component)
   - Update import name (optional, for clarity)
   - Verify close behavior works correctly

3. **No new dependencies required** - using native SVG icons

---

## Testing Plan

### Manual Testing

**Collapsed State**:
1. Click location on map → drawer appears collapsed
2. Verify: Shows location, "Chequear Acera Aquí" button, "X" icon
3. Click "X" → drawer closes completely
4. Drag down from collapsed → nothing (already at minimum)

**Expand Transition**:
1. Click "Chequear Acera Aquí" → drawer expands
2. Verify: Shows "Nuevo Chequeo de Acera" title
3. Verify: **ALL accordions open by default** (SEGURIDAD, UTILIDAD, COMODIDAD, INTERESANTE)
4. Verify: All chevrons pointing up (▲)
5. Verify: All form fields visible immediately
6. Verify: "X" icon still visible in same position

**Accordion Interaction**:
1. All sections already open → click SEGURIDAD header to collapse
2. Verify: Collapses with smooth animation
3. Verify: Chevron rotates 180° (now points down ▼)
4. Click header again → expands
5. Verify: Chevron rotates back (points up ▲)
6. Collapse UTILIDAD → SEGURIDAD stays open (no auto-collapse)
7. Verify: Can collapse/expand each section independently

**Drag to Collapse**:
1. From expanded state, drag down
2. Verify: Returns to collapsed state (not closed)
3. Verify: Location preview still visible
4. Verify: Can expand again

**Close from Expanded**:
1. From expanded state, click "X" → closes completely
2. Click backdrop → closes completely

**Keyboard Navigation**:
1. Tab to "X" button → press Enter → closes
2. Tab to "Chequear Acera Aquí" → press Enter → expands
3. Tab to accordion header → press Enter/Space → toggles

**Mobile Testing**:
1. Tap headers easily (44px+ target)
2. Drag gesture smooth
3. No horizontal scroll
4. Animations not janky

---

## Decision Log

**Why chevrons on the right?**
- More common in 2025 Material Design implementations
- Aligns with form convention (label left, action right)
- Nielsen Norman Group standard

**Why collapse instead of close on drag?**
- Preserves location context
- User can re-expand without re-clicking map
- Follows Google Maps pattern (drawer never fully disappears unless you navigate away)

**Why "Chequear Acera Aquí" instead of "Reportar Problema"?**
- Neutral framing (assessment, not complaint)
- Aligns with walkability scoring mission
- More inviting language

**Why SEGURIDAD first?**
- Highest priority per intake criteria plan
- Core safety mission
- Highest point value (5/10 total walkability score)

**Why all sections open by default?**
- Forms shouldn't hide content from users
- Reduces interaction cost (no hunting/clicking to find fields)
- All fields should be immediately visible and scannable
- User can still collapse sections after reviewing/filling
- Even fields with non-nullable inputs benefit from immediate visibility
- Follows progressive disclosure principle: show everything, let user hide what's done

---

## References

- [Nielsen Norman Group: Accordion Icons](https://www.nngroup.com/articles/accordion-icons/)
- [LogRocket: Accordion UI Design](https://blog.logrocket.com/ux-design/accordion-ui-design/)
- [UX Movement: Accordion Icon Placement](https://uxmovement.com/navigation/where-to-place-your-accordion-menu-icons/)
- [Accessible Accordion Pattern](https://www.aditus.io/patterns/accordion/)
- [Intake Criteria Plan](2024-02-23-intake-criteria.md)
