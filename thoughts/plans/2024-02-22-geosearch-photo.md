# Plan: Address Search & Photo Upload Enhancements (2024-02-22)

## Overview
Build mapper-quality-of-life features so reports feel anchored to real places instead of raw coordinates:
1. Reverse geocoding for map selections + existing report markers to show readable street labels.
2. (Removed per user request 2025-02-22) Address search UI that jumped to a typed location.
3. Photo upload pipeline that stores files in InstantDB Storage and links them to the submitted report.

## Current State
- `src/components/MapView.tsx` renders Leaflet map, manual click selection, and a working geolocation button. No search UI or Nominatim integration.
- Bottom sheet + AddReport flow only display raw lat/lng; `reports` schema has `roadName` but it is always blank.
- `src/components/AddReportForm.tsx` collects category/description/ratings but lacks file inputs and upload handling. Schema already includes `reportPhotos` link to `$files` but UI never uses it.
- No helper exists for calling Nominatim or handling its throttling/formatting.

## What We Are NOT Doing
- No offline caching or storing Nominatim responses locally.
- No cluster/heatmap visualization changes.
- No advanced upload features (multiple files, compression, EXIF parsing) beyond 1-3 photos with size limit.
- No authentication or moderation workflows.
- Address search UI was explicitly dropped on 2025-02-22 (reverse geocoding only).

## Implementation Phases
1. **Nominatim Client + Reverse Geocode Helper**
   - Create `src/lib/nominatim.ts` helper with typed `reverseGeocode(lat, lng)` using fetch + query params + 1 req/sec throttle + User-Agent header (keep `searchPlaces` helper available in case we revisit search later).
   - Add in-memory cache (Map) keyed by lat/lng string to honor rate limits during a single session.
   - Shape outputs so callers always receive `{ label, coordinates, raw }` even if parts are missing.
2. **Map Integration + Address Display**
   - (Search overlay removed per user instruction) Only trigger reverse geocoding after each manual tap and when lazily hydrating existing report markers.
   - When the user taps the map, call `reverseGeocode`, show "Cargando dirección..." states, and fallback to lat/lng when the API fails.
   - When rendering existing report markers/bottom sheet, prefer stored `roadName` and fall back to reverse geocode on-demand (with cache) if empty.
3. **Photo Upload Support**
   - Extend `AddReportForm` with file input (max 3 photos, <=5MB each). Preview and ability to remove before submit.
   - Use InstantDB storage: `const storage = db.storage; await storage.upload(file)` → returns `$files` record; collect IDs to `db.tx.reportPhotos[linkId].link({ report: reportId, photo: fileId })` or equivalent create.
   - Update submission transaction to persist photo links after report creation.
   - Add error handling + UI feedback for upload progress.
4. **Polish + Documentation**
   - Update plan status + record manual test steps in `thoughts/research/` if needed; ensure `CLAUDE.md` references new workflow bits if necessary.

## File-by-File Changes
- `src/lib/nominatim.ts` (new): Fetch helper with rate limiting, reverse geocode, caching, and response typing.
- `src/components/MapView.tsx`: Import search component, manage `searchResults`, `isSearching`, integrate marker highlight logic, show address labels.
- `src/components/SearchLocationInput.tsx` (new): Controlled input w/ debounce, results list, keyboard navigation.
- `src/components/AddReportForm.tsx`: Add photo upload UI, integrate InstantDB storage calls, include previews, handle cleanup on cancel.
- `src/lib/db.ts`: Export storage helper if needed (or re-export from InstantDB client for uploads).
- `thoughts/research/` (optional): add notes about API limits or address fallback.

## Verification Criteria
- **Automated**: `npm run lint` + `npm run build` succeed.
- **Manual**:
  1. Start dev server (`npm run dev`), tap the map in several spots, and confirm the drawer shows "Cargando dirección..." followed by a readable label (falls back to lat/lng if failure).
  2. Existing report markers display stored `roadName` (or cached reverse geocode) in their popups.
  3. Uploading jpg/png (<5MB) attaches preview, submit stores report and photo without console errors.
  4. Submitting without photo still works.
  5. Error banner appears if upload fails or API call throttled.

## Delegation
- Planner complete. Assign Developer Agent to Phases 1-3 sequentially, Reviewer Agent to verify criteria + diff review.

## Status Notes (2025-02-22)
- Phase 1 (**Nominatim Client + Reverse Geocode Helper**): ✅ Implemented `src/lib/nominatim.ts` + shared `src/types/location.ts` with throttling + caches; left `searchPlaces` helper available but UI removed.
- Phase 2 (**Map Integration + Address Display**): ✅ Drawer + report popups now show reverse geocoded labels; per user direction, the address search box was removed since it would not be used.
- Phase 3 (**Photo Upload Support**): ⏳ Not started – next slice once address features stabilize.
- Phase 4 (**Polish + Documentation**): ⚙️ In progress – `npm run build` passes; `npm run lint` still blocked because Next.js wants to bootstrap ESLint config interactively.
