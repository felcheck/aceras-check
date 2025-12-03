# macOS Photo Picker "Open" Button Greyed Out

## Problem Statement
When selecting images from the macOS file picker, specifically from the Photos library (Media > Photos sidebar), the "Open" button is greyed out even when an image is visually selected.

## Root Cause Analysis

### Observation from Screenshot
- User is selecting from **Photos library** (left sidebar shows "Media > Photos")
- An image appears selected (blue border on the street photo)
- The "Open" button is greyed out

### The Photos Library Issue
macOS Photos library stores images in a special managed database, not as regular files. When accessing photos through the standard file picker:

1. **HEIC/HEIF format**: Photos taken on iPhones are stored in HEIC format by default
2. **Photos library access**: The Photos library sidebar in Finder provides a "virtual" view of Photos.app content
3. **File type mismatch**: The `accept="image/*"` MIME type may not properly match HEIC files when accessed through the Photos library interface

### Why `accept="image/*"` May Fail
- macOS may not correctly map HEIC files to `image/*` MIME type through the Photos library bridge
- The Photos library files are referenced differently than regular disk files
- Some photos may be in iCloud and not fully downloaded

## Proposed Solutions

### Option 1: Add explicit HEIC/HEIF support (Recommended)
Add explicit file extensions for Apple's image formats:
```jsx
accept="image/*,.heic,.heif,.HEIC,.HEIF"
```

**Rationale**: The previous revert was because combining MIME types with many extensions caused issues. But adding ONLY HEIC extensions (which are the problematic format) might work because:
- We're targeting the specific format causing issues
- We keep the base `image/*` for standard formats
- Fewer extension = less chance of AND logic interpretation

### Option 2: Use only file extensions (no MIME types)
```jsx
accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.bmp,.tiff"
```

**Rationale**: Pure extension-based filtering avoids MIME type interpretation issues entirely. The trade-off is we need to list all formats explicitly.

### Option 3: Remove accept attribute entirely
```jsx
<input type="file" />
```

Then validate the file type in JavaScript after selection.

**Rationale**: Most permissive approach. Let the user select any file, then validate client-side. Trade-off: users might select wrong file types.

### Option 4: Use capture attribute for mobile, plain input for desktop
Detect environment and render different inputs:
```jsx
{isMobile ? (
  <input type="file" accept="image/*" capture="environment" />
) : (
  <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp,.heic,.heif,.bmp,.tiff,.avif" />
)}
```

## Recommendation
**Start with Option 1** - add explicit HEIC/HEIF extensions while keeping `image/*`. This is the smallest change that directly targets the suspected issue (HEIC files from Photos library).

If that doesn't work, try **Option 2** - pure extension-based filtering.

## Verification Steps
1. Build the app locally (`npm run dev`)
2. Open the AddReportForm
3. Click photo upload button
4. Navigate to Photos library in macOS file picker
5. Select a photo (especially HEIC format)
6. Verify "Open" button is enabled
7. Verify photo uploads and compresses correctly

## Files to Modify
- `src/components/AddReportForm.tsx` (line 498)
- `src/components/WalkabilityPrototypeModal.tsx` (line 1159)

## Status
- [x] Phase 1: Implement Option 1 (add HEIC extensions)
- [ ] Phase 2: Test on macOS with Photos library
- [ ] Phase 3: If fails, try Option 2
- [ ] Phase 4: Verify mobile still works (camera/gallery)
