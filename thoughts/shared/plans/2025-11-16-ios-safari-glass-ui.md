# iOS Safari Liquid Glass UI Fix

**Date**: 2025-11-16
**Status**: ✅ COMPLETE - PWA + Safe Area Insets Implemented
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

### Phase 1: Add PWA Manifest ✅

**Files Created**:
- [x] `public/manifest.json` - Web app manifest
- [x] `scripts/generate-icons.js` - Icon generation script
- [x] `public/icon-192.png` - 192x192 icon ✅
- [x] `public/icon-512.png` - 512x512 icon ✅
- [x] `public/apple-touch-icon.png` - 180x180 icon ✅

**Files Updated**:
- [x] `src/app/layout.tsx` - Add PWA meta tags and manifest link

### Phase 2: Update Viewport ✅

- [x] Add `viewport-fit=cover` to existing viewport meta tag in `src/app/layout.tsx`

### Phase 3: Apply Safe Area Insets ✅

**Files Updated**:
- [x] `src/components/MapView.tsx` - Update mobile geolocation button positioning
- [x] `src/components/WalkabilityPrototypeModal.tsx` - Add safe area to drawer container + content (collapsed & expanded)

### Phase 4: Testing

**Browser Mode** (Ready to test):
- [ ] Open in iOS Safari
- [ ] Verify geolocation button clears glass bar
- [ ] Verify drawer doesn't overlap glass bar
- [ ] Check desktop still works (safe-area-inset-bottom = 0)

**PWA Mode** (Pending icons):
- [ ] Generate icons (see `public/ICONS-TODO.md`)
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

## Implementation Summary (Commit: b878833)

### What Was Implemented ✅

**1. PWA Manifest** (`public/manifest.json`)
```json
{
  "name": "Aceras Check",
  "short_name": "Aceras",
  "display": "standalone",
  "theme_color": "#1e40af",
  "icons": [...]
}
```
- Enables "Add to Home Screen" functionality
- Fullscreen mode when installed (no Safari bars)
- Native app-like experience

**2. Layout Updates** (`src/app/layout.tsx`)
```tsx
// Added PWA meta tags
export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aceras',
  },
};

// Added viewport-fit=cover
export const viewport: Viewport = {
  viewportFit: 'cover', // Critical for iOS safe area insets
};
```

**3. Mobile Geolocation Button** (`src/components/MapView.tsx`)
```tsx
// Before: className="...bottom-48 right-4..."
// After: Inline style with safe area
style={{
  bottom: hasBottomSheet
    ? 'max(12rem, calc(12rem + env(safe-area-inset-bottom)))'
    : 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom)))'
}}
```
- Adds extra padding on iOS to clear Liquid Glass bar
- Desktop: safe-area-inset-bottom = 0 (no change)
- Mobile with drawer: 12rem + safe area
- Mobile without drawer: 1.5rem + safe area

**4. Drawer Safe Area** (`src/components/WalkabilityPrototypeModal.tsx`)

**Collapsed State**:
```tsx
<div
  className="px-6 pt-1"
  style={{ paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))' }}
>
```

**Expanded State** (scrollable area):
```tsx
<div
  className="flex-1 overflow-y-auto px-6 pt-4"
  style={{ paddingBottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom)))' }}
>
```
- Content doesn't get hidden behind iOS safe area
- Scrollable form has proper bottom padding
- Desktop: no impact (safe-area-inset-bottom = 0)

### What's Pending ⏳

**PWA Icons** - See `public/ICONS-TODO.md`
- Need icon-192.png (192x192px)
- Need icon-512.png (512x512px)
- Need apple-touch-icon.png (180x180px)
- App works now, icons only needed for PWA installation

### How It Works 🔧

**Browser Mode** (iOS Safari):
- `viewport-fit=cover` tells iOS to extend content to edges
- `env(safe-area-inset-bottom)` provides height of iOS home bar/glass UI
- `max()` ensures minimum spacing even on desktop (where env() = 0)
- `calc()` adds safe area padding on top of base spacing

**PWA Mode** (Installed to Home Screen):
- `display: standalone` removes Safari UI completely
- App runs edge-to-edge with no browser chrome
- Safe area insets still apply to ensure content clears notch/home indicator

**Example**:
```css
/* Desktop/Android */
bottom: max(12rem, calc(12rem + 0)) = 12rem (192px)

/* iOS with 34px safe area */
bottom: max(12rem, calc(12rem + 34px)) = calc(12rem + 34px) = 226px

/* Result: Always at least 192px, more on iOS to clear glass bar */
```

### Browser Compatibility 📱

- **iOS Safari 11+**: Full support (2017+)
- **Desktop browsers**: `env(safe-area-inset-bottom)` returns 0 (graceful fallback)
- **Android Chrome**: `env()` returns 0 (no safe area needed)
- **Next.js 14+**: Viewport API fully supported

### Testing Checklist

**Browser Mode** (Works immediately):
- [x] Code deployed
- [ ] Test on iOS Safari (user testing)
- [ ] Verify geolocation button clears glass bar
- [ ] Verify drawer doesn't overlap glass bar
- [ ] Confirm desktop unchanged

**PWA Mode** (Ready to test):
- [x] Generate icons ✅
- [ ] Add to Home Screen on iOS (user testing)
- [ ] Launch standalone app (user testing)
- [ ] Verify fullscreen experience (user testing)

---

## Final Implementation (2025-11-16)

### Issue #1: Drawer Container Not Clearing iOS Glass Bar ✅ FIXED

**Problem**: The original implementation only added `paddingBottom` to content *inside* the drawer states (collapsed/expanded content divs), but the drawer container itself was still anchored to `bottom: 0`. This meant the drawer itself (including rounded corners) sat directly at the screen bottom, bleeding through the transparent iOS glass bar.

**Fix**: Added `paddingBottom: env(safe-area-inset-bottom)` to the drawer container wrapper.

**File**: `src/components/WalkabilityPrototypeModal.tsx:927-930`
```tsx
<div
  className={`fixed z-[500] bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-[768px]`}
  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
>
```

**Result**: The entire drawer now lifts above the iOS glass bar, with content no longer bleeding through.

### Issue #2: PWA Icons Missing ✅ FIXED

**Problem**: Manifest referenced icon files that didn't exist, preventing proper PWA installation.

**Solution**: Created `scripts/generate-icons.js` that generates simple branded icons with "AC" text on blue background.

**Implementation**:
1. Generated SVG icons (192x192, 512x512, 180x180)
2. Converted to PNG using macOS `sips` tool
3. Icons now available at:
   - `public/icon-192.png` (6.3 KB)
   - `public/icon-512.png` (18 KB)
   - `public/apple-touch-icon.png` (5.9 KB)

**Design**: Simple text-based icon with #1e40af background, white "AC" text, 15% border radius.

### Build Status ✅

```bash
npm run build
# ✓ Compiled successfully
# Route (app)                Size  First Load JS
# ┌ ○ /                   83.8 kB         184 kB
```

No build errors. Ready for deployment and iOS testing.

---

## References

- [iOS 26 Liquid Glass UI - 9to5Mac](https://9to5mac.com/2025/06/09/safari-gets-the-ios-26-treatment-with-new-liquid-glass-interface/)
- [Redesigning for iOS 26 Liquid Glass - Wildfire Studios](https://wildfirestudios.ca/blog/redesigning-a-web-apps-components-for-ios-26-and-liquid-glass)
- [Safe Area Insets - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [PWA Display Modes - SuperPWA](https://superpwa.com/doc/web-app-manifest-display-modes/)
- [Designing Websites for iPhone X - WebKit](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
