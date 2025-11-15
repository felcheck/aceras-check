# Plan: Carto Voyager + Dark Matter Basemap Trial (2024-02-23)

## Overview
Run a quick experiment replacing the default OSM Standard tiles with Carto styles to assess readability for Panama City reports. Ship a lightweight basemap toggle (Voyager vs Dark Matter) to gather feedback before committing to a permanent theme.

## Current State
- `MapView` hardcodes OpenStreetMap standard tiles via `<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />`.
- No UI exists to switch basemaps or apply dark mode styling.
- Research doc `thoughts/research/2024-02-23-leaflet-themes.md` lists candidate tile URLs and attributions.

## What We Are NOT Doing
- No persistence of user basemap preference beyond in-memory state.
- No full theming overhaul (marker colors, UI backgrounds) yet.
- No integration of additional providers beyond Carto Voyager + Dark Matter.

## Implementation Phases
1. **Tile Provider Abstraction**
   - Create a `const TILE_THEMES = { voyager: {...}, darkMatter: {...} }` describing url + attribution.
   - Update `MapView` to select the current theme’s values when rendering `<TileLayer>`.
2. **Basemap Toggle UI**
   - Add a simple floating UI control (two buttons or select) in the map overlay to switch between Voyager and Dark Matter.
   - Store selection in React state (e.g., `const [theme, setTheme] = useState<'voyager' | 'darkMatter'>('voyager')`).
3. **Readability Validation**
   - Confirm tiles load correctly for Panama center (zoom 14) and markers remain visible on both themes; adjust marker color if Dark Matter reduces contrast.
   - Update attribution text to include Carto + OSM credit per provider requirements.
4. **Documentation**
   - Add short note to `thoughts/research/2024-02-23-leaflet-themes.md` or the plan describing impressions after testing.

## File-by-File Changes
- `src/components/MapView.tsx`: add tile theme definitions, state, toggle UI, and switch TileLayer props accordingly.
- `src/app/globals.css` or component-level styles: optional tweak for toggle styling (minimal).
- `thoughts/research/2024-02-23-leaflet-themes.md`: append post-test observations (manual step).

## Verification Criteria
- Manual run via `npm run dev`:
  1. Map defaults to Carto Voyager and loads quickly.
  2. Switching to Dark Matter updates tiles without reload and markers remain legible.
  3. Attribution text reflects Carto + OSM and remains visible.
  4. No console errors from tile provider rate limits.

## Delegation
- Planner: this doc.
- Developer: implement Phases 1-3, leave notes for impressions.
- Reviewer: sanity-check readability in both modes and ensure controls are accessible.
