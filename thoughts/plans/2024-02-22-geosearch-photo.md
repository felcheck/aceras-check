# Plan: Address Search & Photo Upload Enhancements (2024-02-22)

## Overview
Build two mapper-quality-of-life features:
1. Address/geocode search so contributors can jump to a spot even before tapping the map.
2. Photo upload pipeline that stores files in InstantDB Storage and links them to the submitted report.

## Current State
- `src/components/MapView.tsx` renders Leaflet map, manual click selection, and a working geolocation button. No search UI or Nominatim integration.
- `src/components/AddReportForm.tsx` collects category/description/ratings but lacks file inputs and upload handling. Schema already includes `reportPhotos` link to `$files` but UI never uses it.
- No helper exists for calling Nominatim or handling its throttling/formatting.

## What We Are NOT Doing
- No offline caching or storing Nominatim responses locally.
- No cluster/heatmap visualization changes.
- No advanced upload features (multiple files, compression, EXIF parsing) beyond 1-3 photos with size limit.
- No authentication or moderation workflows.

## Implementation Phases
1. **Nominatim Client + UI Skeleton**
   - Create `src/lib/nominatim.ts` helper with typed `searchPlaces(query)` using fetch + query params + 1 req/sec throttle.
   - Add search bar component (e.g., `SearchLocationInput`) with debounced calls, dropdown results, and selection callback.
2. **Map Integration**
   - Mount search component in `MapView` (top-left overlay). Selecting a result centers map, drops temporary marker, and triggers `onLocationSelect`.
   - Handle loading/empty/error states and ensure keyboard accessibility.
3. **Photo Upload Support**
   - Extend `AddReportForm` with file input (max 3 photos, <=5MB each). Preview and ability to remove before submit.
   - Use InstantDB storage: `const storage = db.storage; await storage.upload(file)` → returns `$files` record; collect IDs to `db.tx.reportPhotos[linkId].link({ report: reportId, photo: fileId })` or equivalent create.
   - Update submission transaction to persist photo links after report creation.
   - Add error handling + UI feedback for upload progress.
4. **Polish + Documentation**
   - Update plan status + record manual test steps in `thoughts/research/` if needed; ensure `CLAUDE.md` references new workflow bits if necessary.

## File-by-File Changes
- `src/lib/nominatim.ts` (new): Fetch helper with rate limiting + response typing.
- `src/components/MapView.tsx`: Import search component, manage `searchResults`, `isSearching`, and integrate marker highlight logic.
- `src/components/SearchLocationInput.tsx` (new): Controlled input w/ debounce, results list, keyboard navigation.
- `src/components/AddReportForm.tsx`: Add photo upload UI, integrate InstantDB storage calls, include previews, handle cleanup on cancel.
- `src/lib/db.ts`: Export storage helper if needed (or re-export from InstantDB client for uploads).
- `thoughts/research/` (optional): add notes about API limits if run into issues (out of scope unless necessary).

## Verification Criteria
- **Automated**: `npm run lint` + `npm run build` succeed.
- **Manual**:
  1. Start dev server (`npm run dev`), confirm search input appears and debounced results show for "Calle 50".
  2. Selecting a result pans map + sets AddReport location lat/lng shown in modal.
  3. Uploading jpg/png (<5MB) attaches preview, submit stores report and photo without console errors.
  4. Submitting without photo still works.
  5. Error banner appears if upload fails or API call throttled.

## Delegation
- Planner complete. Assign Developer Agent to Phases 1-3 sequentially, Reviewer Agent to verify criteria + diff review.
