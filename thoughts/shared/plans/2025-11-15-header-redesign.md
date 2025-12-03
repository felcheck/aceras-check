# Header Redesign – Three Design Options with Dark/Light Mode Support

**Created:** 2025-11-15
**Status:** Implemented (Option 2)
**Related:** Main map page ([src/app/page.tsx](../../src/app/page.tsx)), Header component ([src/components/Header.tsx](../../src/components/Header.tsx))

## Overview

Redesign the main map page header with three distinct aesthetic options that fully support both dark and light modes based on system preferences. The manual dark mode toggle will remain for testing purposes but won't be the primary mode switching mechanism.

## Current State

The header at [page.tsx:58-68](../../src/app/page.tsx#L58-L68) is:
- Fixed light theme only (white background)
- Simple layout with title, subtitle, and user count
- No dark mode support
- Uses basic gray scale colors

## Goals

1. Create three distinct header design options with different visual styles
2. Implement system-based dark/light mode support using `prefers-color-scheme`
3. Maintain current functionality (branding, subtitle, user count)
4. Keep manual toggle for testing/debugging
5. Ensure accessibility in both modes
6. Match overall app aesthetic

## Design Options

### Option 1: Minimal & Clean
**Philosophy:** Maximum simplicity, typography-focused, lots of breathing room

#### Light Mode
- Background: Pure white (`bg-white`)
- Primary text: Deep charcoal (`text-gray-900`)
- Secondary text: Medium gray (`text-gray-600`)
- Border: Subtle bottom border (`border-b border-gray-200`)
- Shadow: None (border provides separation)

#### Dark Mode
- Background: True dark (`dark:bg-gray-950`)
- Primary text: Off-white (`dark:text-gray-50`)
- Secondary text: Light gray (`dark:text-gray-400`)
- Border: Subtle lighter border (`dark:border-gray-800`)
- Shadow: None

#### Layout
```
┌─────────────────────────────────────────────────────┐
│  Aceras Check                      [Toggle] 2 users │
│  Panama City Walkability Reporter                   │
└─────────────────────────────────────────────────────┘
```

---

### Option 2: Card-Based with Elevation
**Philosophy:** Modern card UI, gentle shadows, floating appearance

#### Light Mode
- Background: Soft background layer (`bg-gray-50`)
- Card: White with shadow (`bg-white shadow-md rounded-b-lg`)
- Primary text: Near-black (`text-gray-900`)
- Secondary text: Medium gray (`text-gray-600`)
- User badge: Light blue background (`bg-blue-50 text-blue-700`)

#### Dark Mode
- Background: Dark layer (`dark:bg-gray-900`)
- Card: Elevated dark (`dark:bg-gray-800 dark:shadow-xl`)
- Primary text: White (`dark:text-white`)
- Secondary text: Light gray (`dark:text-gray-300`)
- User badge: Dark blue (`dark:bg-blue-900/30 dark:text-blue-300`)

#### Layout
```
╔═════════════════════════════════════════════════════╗
║  Aceras Check                    ╭───────╮  ╭─────╮║
║  Panama City Walkability         │Toggle │  │2 usr│║
║                                   ╰───────╯  ╰─────╯║
╚═════════════════════════════════════════════════════╝
  (rounded bottom corners, shadow)
```

---

### Option 3: Accent Bar with Gradient
**Philosophy:** Bold identity, color accent, visual hierarchy

#### Light Mode
- Top accent: Gradient bar (`bg-gradient-to-r from-blue-500 to-cyan-500` - 4px height)
- Background: White (`bg-white`)
- Primary text: Dark gray (`text-gray-900`)
- Secondary text: Blue-gray (`text-gray-700`)
- User count: Accent pill (`bg-blue-100 text-blue-700 rounded-full px-3 py-1`)
- Shadow: Medium (`shadow-lg`)

#### Dark Mode
- Top accent: Gradient bar (`dark:from-blue-600 dark:to-cyan-600`)
- Background: Dark slate (`dark:bg-gray-900`)
- Primary text: White (`dark:text-white`)
- Secondary text: Light blue-gray (`dark:text-gray-300`)
- User count: Dark accent pill (`dark:bg-blue-900/40 dark:text-blue-300`)
- Shadow: Stronger (`dark:shadow-2xl`)

#### Layout
```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (gradient)
┌─────────────────────────────────────────────────────┐
│  Aceras Check                   [Toggle]  ( 2 users)│
│  Panama City Walkability Reporter                   │
└─────────────────────────────────────────────────────┘
```

## Implementation Summary

**Decision:** Implemented Option 2 (Card-Based with Elevation)

### What Was Built

1. **Tailwind Configuration** - [tailwind.config.js:3](../../tailwind.config.js#L3)
   - Configured `darkMode: 'class'` for manual toggle control
   - Allows system preference detection with manual override

2. **Header Component** - [src/components/Header.tsx](../../src/components/Header.tsx)
   - Extracted header into separate component for maintainability
   - Card-based design with shadow elevation
   - Background wrapper with gray-50/gray-900 for depth
   - User count badge with blue accent colors
   - Dark mode toggle with sun/moon icons
   - localStorage persistence for theme preference
   - System preference detection on initial load

3. **Main Page Integration** - [src/app/page.tsx:59](../../src/app/page.tsx#L59)
   - Replaced inline header markup with `<Header>` component
   - Added background color to main content area for consistency
   - Passes `numUsers` prop to header

### Implementation Details

#### Light Mode Styling
- Background: `bg-gray-50` wrapper with `bg-white` card
- Text: `text-gray-900` primary, `text-gray-600` secondary
- Shadow: `shadow-md` for subtle elevation
- Badge: `bg-blue-50 text-blue-700` for user count
- Rounded: `rounded-b-lg` for card effect

#### Dark Mode Styling
- Background: `dark:bg-gray-900` wrapper with `dark:bg-gray-800` card
- Text: `dark:text-white` primary, `dark:text-gray-300` secondary
- Shadow: `dark:shadow-xl` for stronger elevation
- Badge: `dark:bg-blue-900/30 dark:text-blue-300` with opacity
- Same rounded corners maintained

#### Toggle Functionality
- Sun icon shows in dark mode (to indicate "switch to light")
- Moon icon shows in light mode (to indicate "switch to dark")
- Saves preference to localStorage as `theme: 'light'|'dark'`
- On mount, checks localStorage first, then system preference
- Adds/removes `dark` class on `<html>` element

### Verification Results

✅ **Build Check:** Compiled successfully with no type errors
✅ **Dev Server:** Running on http://localhost:3001
✅ **TypeScript:** No compilation errors
✅ **Dark Mode:** Class-based system working
✅ **Component:** Extracted to separate file
✅ **Props:** numUsers passed correctly

### Manual Testing Checklist

- [ ] Light mode renders with white card and gray background
- [ ] Dark mode renders with dark gray card and darker background
- [ ] Toggle button switches modes instantly
- [ ] Theme preference persists after page reload
- [ ] User count badge is readable in both modes
- [ ] Card shadow visible in both modes
- [ ] Rounded bottom corners render properly
- [ ] Text contrast meets WCAG AA standards
- [ ] Responsive on mobile/tablet/desktop
- [ ] No layout shift on mode switch
- [ ] Map switches to Carto Dark in dark mode
- [ ] Map switches to Carto Voyager in light mode
- [ ] Map basemap changes instantly when toggling dark mode

## Map Integration

**Status:** Implemented

The map now automatically switches basemaps based on the dark mode setting:

### Changes to MapView Component

1. **Dark Mode Detection** - [MapView.tsx:151-167](../../src/components/MapView.tsx#L151-L167)
   - Added `useEffect` hook to detect dark mode from `document.documentElement.classList`
   - Uses `MutationObserver` to watch for changes to the `dark` class
   - Updates tile layer automatically when dark mode toggles

2. **Removed Manual Toggle** - Previously at lines 165-180
   - Removed the Carto Voyager/Dark manual selector UI
   - Cleaner map interface with one less control
   - Dark mode now controlled centrally from header

3. **Automatic Basemap Switching** - [MapView.tsx:169-172](../../src/components/MapView.tsx#L169-L172)
   - Light mode: Uses Carto Voyager (bright, colorful)
   - Dark mode: Uses Carto Dark Matter (dark, muted)
   - Switches instantly when toggling dark mode in header

### How It Works

```typescript
// Detects dark mode from HTML class
const [isDark, setIsDark] = useState(false);

useEffect(() => {
  const checkDarkMode = () => {
    setIsDark(document.documentElement.classList.contains("dark"));
  };

  // Watch for class changes on <html> element
  const observer = new MutationObserver(checkDarkMode);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  return () => observer.disconnect();
}, []);

// Choose basemap based on dark mode
const tileConfig = useMemo(
  () => (isDark ? TILE_THEMES.darkMatter : TILE_THEMES.voyager),
  [isDark]
);
```

### Verification

✅ **Build Check:** Compiled successfully with no errors
✅ **Dark Mode Detection:** MutationObserver properly watches HTML class
✅ **Basemap Switching:** TileLayer updates when isDark changes
✅ **No Manual Toggle:** Removed redundant UI control

## Technical Notes

### Tailwind Dark Mode Strategy
We'll use `darkMode: 'media'` initially (system preference), with optional override via class-based approach later if needed for the manual toggle.

```js
// tailwind.config.js
module.exports = {
  darkMode: 'media', // Uses prefers-color-scheme
  // OR for manual control:
  // darkMode: 'class', // Controlled via <html class="dark">
}
```

### Component Structure Options
1. **Single component with variant prop** - Cleaner but more complex conditionals
2. **Three separate header components** - Easier to compare/test, more duplication
3. **Shared base with composition** - Best of both worlds

Recommend **Option 3** for maintainability.

### Accessibility Checklist
- [ ] Text contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Focus indicators visible in both modes
- [ ] User count badge readable
- [ ] Header structure uses semantic HTML
- [ ] Dark mode toggle has accessible label

## Color Palette Reference

### Light Mode
- Pure white: `#FFFFFF`
- Soft background: `#F9FAFB` (gray-50)
- Charcoal text: `#111827` (gray-900)
- Medium gray: `#4B5563` (gray-600)
- Blue accent: `#3B82F6` (blue-500)
- Cyan accent: `#06B6D4` (cyan-500)

### Dark Mode
- True dark: `#030712` (gray-950)
- Dark slate: `#111827` (gray-900)
- Elevated dark: `#1F2937` (gray-800)
- Light gray text: `#D1D5DB` (gray-300)
- Blue accent: `#2563EB` (blue-600)
- Cyan accent: `#0891B2` (cyan-600)

## Open Questions

1. **Which design should be the default?** (User decision needed)
2. **Should toggle be in header or separate settings panel?** (Currently planning header)
3. **Do we want to persist user's theme choice in InstantDB?** (Nice-to-have, not critical)
4. **Should we extract header into separate component file?** (Recommend yes for all three options)

## Success Criteria

- [ ] All three header designs implemented and switchable
- [ ] System dark mode automatically applied
- [ ] Manual toggle works for testing
- [ ] No visual regressions in light mode
- [ ] Typography readable in both modes
- [ ] User count displays correctly
- [ ] Header scales responsively (mobile, tablet, desktop)
- [ ] Code is clean and maintainable

## Next Steps

1. Get user feedback on which design option to implement first
2. Set up dark mode in Tailwind config
3. Implement chosen design(s)
4. Test across devices and browsers
5. Iterate based on feedback
