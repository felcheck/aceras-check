# iOS Safari Liquid Glass UI Fix

**Date**: 2025-11-16
**Status**: Planning
**Goal**: Fix "off" appearance caused by iOS 26 Safari's transparent Liquid Glass bottom bar

## Problem Statement

iOS 26 introduced "Liquid Glass" UI - a translucent floating toolbar that shows webpage content underneath. This creates visual issues:
- Map content bleeds through the transparent Safari bar
- Looks "off" and unprofessional
- Bottom UI elements (geolocation button, drawer) don't account for the glass bar

## Research Summary

### iOS 26 Liquid Glass Behavior

**Key Findings**:
- Safari toolbar is now semi-transparent, floating above content
- Web pages extend edge-to-edge to maximize space
- Tab bar floats above webpage with content visible through it
- Three toolbar modes: Compact (default), Bottom, Top

**Technical Challenges**:
- `env(safe-area-inset-bottom)` provides the height of the home bar
- Requires `viewport-fit=cover` in viewport meta tag
- Modal backgrounds create "patchy" look with transparent bar
- VH unit behavior changed - always 1 point of window.outerHeight

### Best Practices (2025)

**PWA Approach**:
- `display: "standalone"` in web app manifest
- Hides Safari UI completely when installed
- Requires "Add to Home Screen"
- Works for frequent users

**Browser Approach**:
- Use `env(safe-area-inset-bottom)` for spacing
- Add `viewport-fit=cover` to viewport meta
- Apply padding to bottom elements
- Works for all users, no install needed

## Solution: Hybrid Approach (PWA + Safe Area Insets)

Implement both strategies for maximum coverage:

### 1. Progressive Web App (PWA) Support ✅

**Benefits**:
- Fullscreen experience (no Safari bars)
- Native app feel
- Better for repeat users
- One-time "Add to Home Screen" setup

**Implementation**:
```json
// public/manifest.json
{
  "name": "Aceras Check",
  "short_name": "Aceras",
  "description": "Chequea la caminabilidad de tu ciudad",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Required Meta Tags** (app/layout.tsx):
```tsx
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Aceras" />
<link rel="manifest" href="/manifest.json" />
```

### 2. Safe Area Insets for Browser Mode ✅

**Benefits**:
- Works for all users immediately
- No installation required
- Graceful fallback for non-PWA users

**Implementation**:

**Viewport Update**:
```tsx
// Add viewport-fit=cover
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

**CSS Safe Area Padding**:
```css
/* Apply to bottom-anchored elements */
.mobile-geolocation-button {
  /* Old: bottom-48 (192px) */
  /* New: Account for iOS safe area */
  bottom: max(12rem, calc(12rem + env(safe-area-inset-bottom)));
}

.drawer-container {
  /* Add safe area to collapsed drawer */
  padding-bottom: env(safe-area-inset-bottom);
}

/* For body when drawer is active */
body.drawer-active {
  padding-bottom: env(safe-area-inset-bottom);
}
```

**Rationale**:
- `max()` ensures minimum spacing (192px) even when safe-area-inset-bottom is 0 (desktop)
- `env(safe-area-inset-bottom)` adds extra padding on iOS to clear the glass bar
- Progressive enhancement - works everywhere, enhanced on iOS

### 3. PWA Icons Generation

**Icon Sizes Needed**:
- 192x192 (required for manifest)
- 512x512 (required for manifest, maskable)
- 180x180 (apple-touch-icon)

**Source**: Use existing logo or create simple icon with "AC" branding

**Generation Options**:
1. Use existing header logo as base
2. Create simple icon with blue background + white "AC"
3. Use PWA icon generator tool

## Implementation Plan

### Phase 1: Add PWA Manifest (15 minutes)

**Files to Create**:
- [ ] `public/manifest.json` - Web app manifest
- [ ] `public/icon-192.png` - 192x192 icon
- [ ] `public/icon-512.png` - 512x512 icon
- [ ] `public/apple-touch-icon.png` - 180x180 icon (optional but recommended)

**Files to Update**:
- [ ] `src/app/layout.tsx` - Add PWA meta tags and manifest link

### Phase 2: Update Viewport (2 minutes)

- [ ] Add `viewport-fit=cover` to existing viewport meta tag in `src/app/layout.tsx`

### Phase 3: Apply Safe Area Insets (10 minutes)

**Files to Update**:
- [ ] `src/components/MapView.tsx` - Update mobile geolocation button positioning
- [ ] `src/components/WalkabilityPrototypeModal.tsx` - Add safe area to drawer
- [ ] `src/app/globals.css` - Add safe area CSS utilities (optional)

### Phase 4: Testing (5 minutes)

**Browser Mode**:
- [ ] Open in iOS Safari
- [ ] Verify geolocation button clears glass bar
- [ ] Verify drawer doesn't overlap glass bar
- [ ] Check desktop still works (safe-area-inset-bottom = 0)

**PWA Mode**:
- [ ] Tap Share → Add to Home Screen
- [ ] Launch from home screen
- [ ] Verify fullscreen (no Safari bars)
- [ ] Test drawer, geolocation, all interactions

---

## Icon Design Approach

**Option 1: Simple Text Icon** (Fastest)
```
Background: #1e40af (blue-600)
Text: "AC" or "🚶"
Font: Bold, sans-serif
Color: White
```

**Option 2: Use Existing Branding**
- Extract/simplify existing logo
- Ensure works at small sizes
- Add background for contrast

**Recommendation**: Start with Option 1 (simple text icon), iterate later if needed

---

## Technical Details

### Manifest Fields Explained

- **`display: "standalone"`**: Hides Safari UI, feels like native app
- **`scope: "/"`**: All pages under root are in-app (no Safari bar)
- **`start_url: "/"`**: Opens at homepage when launched
- **`orientation: "portrait"`**: Mobile-first, locks to portrait
- **`theme_color: "#1e40af"`**: Status bar color (blue to match branding)

### Safe Area Inset Browser Support

- **iOS Safari**: Full support since iOS 11 (2017)
- **Desktop browsers**: Returns 0 (safe fallback)
- **Android Chrome**: Returns 0 (doesn't have notch/home bar issues)

**Fallback Strategy**:
```css
/* Desktop/Android: Uses 12rem (192px) */
bottom: 12rem;

/* iOS with safe area: Uses 12rem + safe area */
bottom: max(12rem, calc(12rem + env(safe-area-inset-bottom)));
```

---

## Decision Log

**Why hybrid approach instead of PWA-only?**
- Not all users will install the PWA
- Safe area insets work for everyone immediately
- PWA provides superior UX for those who do install
- Low effort to implement both (~30 minutes total)

**Why not just use a solid background bar?**
- Would look dated compared to iOS design language
- Wastes vertical space on mobile
- Safe area insets are the modern standard

**Why include maskable icon?**
- iOS adaptive icons use maskable purpose
- Ensures icon looks good when masked to shape
- Small effort, better visual consistency

---

## Success Criteria

**Browser Mode** (Safari):
- ✅ Map doesn't bleed through glass bar awkwardly
- ✅ Geolocation button fully visible above glass bar
- ✅ Drawer respects safe area
- ✅ Works on desktop (no regressions)

**PWA Mode** (Installed):
- ✅ No Safari bars visible
- ✅ Fullscreen edge-to-edge
- ✅ Icon appears on home screen
- ✅ All functionality works

---

## Future Enhancements

**Optional PWA Features** (not in scope now):
- Offline support (service worker)
- Push notifications
- Background sync
- Install prompt UI

**Current Focus**: Visual polish only - make it look good in both Safari and PWA mode.

---

## References

- [iOS 26 Liquid Glass UI - 9to5Mac](https://9to5mac.com/2025/06/09/safari-gets-the-ios-26-treatment-with-new-liquid-glass-interface/)
- [Redesigning for iOS 26 Liquid Glass - Wildfire Studios](https://wildfirestudios.ca/blog/redesigning-a-web-apps-components-for-ios-26-and-liquid-glass)
- [Safe Area Insets - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [PWA Display Modes - SuperPWA](https://superpwa.com/doc/web-app-manifest-display-modes/)
- [Designing Websites for iPhone X - WebKit](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
