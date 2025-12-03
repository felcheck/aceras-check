# Plan: Execute Address Search & Photo Upload Slice (2024-02-22)

## Overview
Implement the gaps identified in the prior assessment so mappers can search by address and attach photos to new reports. This bridges the MVP map currently live with the goals captured in the PRD and earlier planning document.

## Current State
- `MapView` (src/components/MapView.tsx) already handles map rendering, click selection, and geolocation (Phase 1-2 base work complete) but lacks any search UI or Nominatim helper.
- `AddReportForm` (src/components/AddReportForm.tsx) posts textual data to InstantDB but has no notion of photos or uploads.
- Schema (`src/instant.schema.ts`) already has `reportPhotos` links and `$files` entity defined.
- No files exist for `SearchLocationInput` or `lib/nominatim`, and nothing references InstantDB storage.

## What We Are NOT Doing
- No clustering/heatmaps or report list sidebar (future phases).
- No offline caching or storing Nominatim results beyond in-memory state.
- No photo editing, compression, or EXIF handling beyond basic size/type validation.
- No auth/moderation or dashboard work.

## Implementation Phases
1. **Nominatim Client + Search Component**
   - Create `src/lib/nominatim.ts` with a typed `searchPlaces(query: string)` helper, enforced 1 req/sec throttle, and graceful error handling.
   - Build `src/components/SearchLocationInput.tsx` with controlled input, debounce (~400ms), and dropdown results showing name + address snippet.
2. **Map Integration**
   - Mount `SearchLocationInput` inside `MapView` (top-left overlay). Selecting a result should pan/zoom to coordinates, drop a temporary highlight marker, and call `onLocationSelect` to prefill the AddReport CTA.
   - Manage loading/empty states, clear results on map click, and ensure keyboard accessibility (arrow/enter).
3. **Photo Upload Support**
   - Enhance `AddReportForm` with up to 3 file inputs (jpg/png, <=5MB) showing thumbnails + remove buttons.
   - Use `db.storage` to upload each file, then create `reportPhotos` links referencing the newly created `$files` entries inside/after the report transaction.
   - Display upload progress/error states and prevent duplicate submissions.
4. **Verification + Docs**
   - Update this plan status, log any API findings in `thoughts/research/` if needed, and confirm `CLAUDE.md` references remain accurate.

## File-by-File Changes
- `src/lib/nominatim.ts` (new): export debounced/throttled fetch helper and types for Nominatim responses.
- `src/components/SearchLocationInput.tsx` (new): UI + hooks for search, result list, selection callback.
- `src/components/MapView.tsx`: import and render search component; track highlighted search result marker; wire selection to `onLocationSelect` and map flyTo.
- `src/components/AddReportForm.tsx`: add photo upload inputs, preview UI, InstantDB storage calls, link creation, and improved submit UX.
- `src/lib/db.ts`: optionally export `db.storage` helper if needed for uploads (or re-export typed helper for reuse).
- `thoughts/research/` (optional): capture rate-limit learnings if the API misbehaves.

## Verification Criteria
- **Automated**: `npm run lint` and `npm run build` pass.
- **Manual**:
  1. Search "Calle 50" → dropdown populates, selecting pans the map and pre-selects coordinates for the report button.
  2. Submitting AddReport with no photos still succeeds.
  3. Uploading 1-3 valid images shows previews and results in report entries linked to `$files` (verify via InstantDB dashboard or console logs).
  4. Invalid uploads (too large/wrong type) surface user-friendly errors.
  5. Geolocation button + map click still behave as before (regression check).

## Delegation
- **Planner**: this document.
- **Developer**: execute Phases 1-3 sequentially, updating plan checkboxes and adding any research notes referenced in Phase 4.
- **Reviewer**: validate against verification criteria and cite this plan in review notes.
