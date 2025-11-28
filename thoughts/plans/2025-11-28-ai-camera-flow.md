# AI-Powered Camera-First Sidewalk Assessment Flow

> **Plan ID**: 2025-11-28-ai-camera-flow
> **Branch**: `main` (merged)
> **Status**: All Phases Complete - In Production
> **Author**: Planner Agent
> **Last Updated**: 2025-11-28

---

## 0. Executive Summary

Replace the current manual form-first flow with a camera-first experience where:
1. User taps "Chequear Acera Aquí" → camera opens with overlay instructions
2. User takes photo → self-assesses quality (blur, visibility)
3. AI analyzes photo → returns draft assessment with structured outputs
4. User reviews/adjusts AI draft → submits to InstantDB

**Goal**: Reduce friction for field data collection while maintaining data quality through AI assistance.

---

## 1. Current State Analysis

### Existing Flow
1. User taps location on map → `selectedLocation` state set
2. `WalkabilityPrototypeModal` appears (collapsed drawer)
3. User expands drawer → fills manual form with 4 buckets:
   - UTILIDAD (amenities nearby)
   - SEGURIDAD (sidewalk, width, obstructions, lighting)
   - COMODIDAD (shade, contaminants)
   - INTERESANTE (commerce, vibe)
4. Optional: User uploads photo via file picker
5. User submits → data saved to InstantDB `reports` entity

### Current Schema (relevant fields)
```typescript
reports: {
  // Ratings
  hasSidewalk, widthRating, obstructions, comfortSpaceRating,
  hasLighting, lightingRating, conditionRating, safetyRating,
  accessibilityRating, severity,

  // Scores (computed)
  seguridadScore, utilidadScore, comodidadScore, interesanteScore, totalScore,

  // Location
  lat, lng, address, roadId, roadName,

  // Meta
  description, status, createdAt, updatedAt
}
```

### Current Files
- `src/app/page.tsx` - Main app, manages `selectedLocation` + `showReportForm`
- `src/components/WalkabilityPrototypeModal.tsx` - Main form (~1300 lines)
- `src/components/AddReportForm.tsx` - Legacy form (unused in current flow)
- `src/components/MapView.tsx` - Map display + location selection
- `src/instant.schema.ts` - Database schema
- `src/lib/db.ts` - InstantDB client

---

## 2. Scope Definition

### In Scope (This Iteration)
- [x] Camera capture component with custom overlay
- [x] Photo quality self-assessment screen
- [x] AI vision analysis integration (GPT-4o-mini - changed from Gemini)
- [x] Draft review/edit screen with AI suggestions
- [x] Schema updates for AI tracking fields
- [x] API route for AI analysis (server-side for API key security)
- [x] Error handling + retry flow
- [x] Mobile-first responsive design
- [x] **Email magic link authentication** (added 2025-11-28)
- [x] **User reports linked to author** (added 2025-11-28)
- [x] **My Reports view** (added 2025-11-28)

### Out of Scope (Future Iterations)
- AI-based blur detection (keep as user self-assessment)
- Offline mode / PWA enhancements
- Multi-photo capture per report
- Video capture
- UTILIDAD bucket AI analysis (requires map context, not just photo)
- INTERESANTE bucket AI analysis (too subjective)
- Historical photo comparison
- Batch processing multiple locations

---

## 3. Technical Decisions

### AI Provider: Google Gemini 2.0 Flash
**Rationale**:
- Cost: ~$0.0006/image (10-30x cheaper than alternatives)
- Free tier: 15 req/min, 1M req/day for development
- Good vision quality for infrastructure detection
- Fast inference ("Flash" model)
- Supports structured JSON output

**Fallback**: If quality insufficient, upgrade to Gemini 2.5 Flash ($0.002/image)

### Camera Library: react-webcam
**Rationale**:
- Most popular React camera library (1.5M weekly downloads)
- Good mobile support (iOS Safari, Android Chrome)
- Simple API: `getScreenshot()` returns base64
- Supports `facingMode: { exact: "environment" }` for rear camera
- Easy to overlay custom UI

**Alternative considered**: react-camera-pro (mobile-focused but less community support)

### Architecture Pattern
```
[Camera Component]
    → base64 image
    → [Quality Check Screen]
    → user confirms
    → [API Route /api/analyze-sidewalk]
    → Gemini API call (server-side)
    → structured JSON response
    → [Review/Edit Screen]
    → user adjusts
    → [InstantDB save]
```

---

## 4. Schema Changes

### New Fields for `reports` Entity

```typescript
// AI Analysis Tracking
aiGenerated: i.boolean().optional(),        // Was this report AI-drafted?
aiConfidence: i.number().optional(),        // Overall confidence 0-1
aiRawResponse: i.json().optional(),         // Full AI response for evals
userModified: i.boolean().optional(),       // Did user change AI draft?
aiModel: i.string().optional(),             // e.g., "gemini-2.0-flash"
aiProcessedAt: i.number().optional(),       // Timestamp of AI analysis

// AI-specific assessments (separate from user-confirmed values)
aiDescription: i.string().optional(),       // AI-generated description
aiSuggestedIssues: i.json().optional(),     // Array of detected issues
```

### Migration Strategy
- All new fields are optional → no breaking changes
- Existing reports remain unchanged
- New camera flow populates AI fields; manual edit flow does not

---

## 5. Implementation Phases

### Phase 1: Foundation (Day 1)
**Goal**: Camera capture + quality check working

#### 1.1 Install Dependencies
```bash
npm install react-webcam
```

#### 1.2 Create Camera Component
**File**: `src/components/CameraCapture.tsx`

Features:
- Fullscreen camera view
- Rear camera default (`facingMode: "environment"`)
- Overlay with instructions:
  - "Apunta a la acera"
  - "Incluye la calle y la acera en la foto"
  - Viewfinder guide box
- Capture button
- Close/cancel button
- Flash toggle (if supported)

#### 1.3 Create Quality Check Screen
**File**: `src/components/PhotoQualityCheck.tsx`

Features:
- Display captured photo
- Questions:
  - "¿Se puede ver claramente la acera?" (Yes/No)
  - "¿No está borrosa la foto?" (Yes/No)
- Buttons: "Tomar otra foto" / "Continuar"
- If user says "No" to either → back to camera

#### 1.4 Update Page Flow
**File**: `src/app/page.tsx`

New state machine:
```typescript
type FlowState =
  | 'map'           // Default - viewing map
  | 'camera'        // Camera open
  | 'quality-check' // Reviewing photo quality
  | 'analyzing'     // AI processing
  | 'review'        // Editing AI draft
  | 'submitting';   // Saving to DB
```

---

### Phase 2: AI Integration (Day 2)
**Goal**: Gemini API integration + structured output

#### 2.1 Create API Route
**File**: `src/app/api/analyze-sidewalk/route.ts`

```typescript
// POST /api/analyze-sidewalk
// Body: { image: base64string, location: { lat, lng, address } }
// Response: { success: boolean, analysis: StructuredAnalysis, rawResponse: object }
```

#### 2.2 Define Structured Output Schema
```typescript
interface SidewalkAnalysis {
  // Detection confidence
  confidence: number;           // 0-1 overall confidence
  sidewalkVisible: boolean;     // Could AI see a sidewalk?

  // SEGURIDAD bucket (AI-filled)
  hasSidewalk: boolean | null;
  sidewalkWidth: 'narrow' | 'adequate' | 'wide' | null;
  widthRating: number;          // 1-5
  obstructions: string[];       // ['holes', 'cars', 'construction', etc.]
  hasLighting: boolean | null;  // May be null for daytime photos
  lightingRating: number | null;

  // Condition assessment
  conditionRating: number;      // 1-5 pavement quality
  safetyRating: number;         // 1-5 overall safety
  accessibilityRating: number;  // 1-5 wheelchair/stroller friendly

  // Description
  description: string;          // Natural language summary
  detectedIssues: string[];     // List of specific problems found

  // Quality feedback
  imageQuality: 'good' | 'acceptable' | 'poor';
  qualityIssues: string[];      // ['blurry', 'sidewalk_not_visible', etc.]
  retakeRecommended: boolean;   // AI suggests retaking photo
}
```

#### 2.3 Gemini Prompt Engineering
```
You are analyzing a street photo from Panama City to assess sidewalk walkability.

Analyze the image and provide a structured assessment of:
1. Whether a sidewalk is visible and its condition
2. Width assessment (narrow/adequate/wide)
3. Any obstructions (holes, parked cars, vendors, construction, business encroachment)
4. Pavement condition (cracks, damage, missing sections)
5. Lighting infrastructure (if visible - may not be detectable in daytime)
6. Accessibility for wheelchairs/strollers
7. Overall safety impression

If you cannot clearly see the sidewalk or the image is too blurry, indicate this in qualityIssues and set retakeRecommended to true.

Respond ONLY with valid JSON matching this schema: [schema]
```

#### 2.4 Environment Variables
**File**: `.env.local`
```
GOOGLE_AI_API_KEY=your_gemini_api_key
```

---

### Phase 3: Review/Edit Screen (Day 2-3)
**Goal**: User can review and adjust AI draft

#### 3.1 Create Review Component
**File**: `src/components/AIDraftReview.tsx`

Features:
- Show captured photo (thumbnail)
- AI-generated description (editable textarea)
- Structured fields as editable form:
  - hasSidewalk (toggle)
  - widthRating (1-5 slider)
  - obstructions (multi-select chips)
  - conditionRating (1-5 slider)
  - safetyRating (1-5 slider)
  - accessibilityRating (1-5 slider)
- Highlight AI-suggested values vs user changes
- "Comfort Space" rating (user-only, not AI)
- Show AI confidence indicator
- If `retakeRecommended: true`, show warning banner

#### 3.2 Track User Modifications
- Compare AI draft to final submission
- Set `userModified: true` if any field changed
- Store both AI original and user final values

---

### Phase 4: Integration + Polish (Day 3)
**Goal**: Complete flow, error handling, mobile optimization

#### 4.1 Update WalkabilityPrototypeModal
- Add "camera mode" trigger from collapsed state
- Integrate new flow states
- Keep existing manual form as fallback/edit mode

#### 4.2 Error Handling
- Camera permission denied → show instructions
- AI API failure → retry button + fallback to manual form
- Network error → queue for later (stretch)

#### 4.3 Mobile Optimization
- Test on iOS Safari (camera requires HTTPS)
- Test on Android Chrome
- Handle orientation changes
- Optimize for one-handed use

#### 4.4 Schema Migration
- Update `src/instant.schema.ts` with new fields
- Test backward compatibility

---

## 6. File-by-File Changes

| File | Action | Key Changes |
|------|--------|-------------|
| `src/instant.schema.ts` | MODIFY | Add AI tracking fields |
| `src/app/page.tsx` | MODIFY | Add flow state machine, camera trigger |
| `src/components/CameraCapture.tsx` | CREATE | Fullscreen camera with overlay |
| `src/components/PhotoQualityCheck.tsx` | CREATE | Quality self-assessment screen |
| `src/components/AIDraftReview.tsx` | CREATE | Review/edit AI analysis |
| `src/app/api/analyze-sidewalk/route.ts` | CREATE | Gemini API integration |
| `src/lib/gemini.ts` | CREATE | Gemini client + prompt |
| `src/components/WalkabilityPrototypeModal.tsx` | MODIFY | Integrate camera flow, keep manual mode |
| `package.json` | MODIFY | Add react-webcam dependency |
| `.env.local` | MODIFY | Add GOOGLE_AI_API_KEY |
| `.env.example` | CREATE | Document required env vars |

---

## 7. Verification Criteria

### Automated Checks
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] TypeScript: no type errors
- [ ] All new components have proper TypeScript interfaces

### Manual Testing

#### Camera Flow
- [ ] Camera opens on "Chequear Acera Aquí" tap
- [ ] Rear camera is default on mobile
- [ ] Overlay instructions visible
- [ ] Capture button takes photo
- [ ] Close button returns to map

#### Quality Check
- [ ] Photo displays correctly
- [ ] "No" answers return to camera
- [ ] "Yes" to both proceeds to AI analysis

#### AI Analysis
- [ ] Loading state shown during analysis
- [ ] AI returns structured response
- [ ] Error state shows retry option
- [ ] Fallback to manual form works

#### Review Screen
- [ ] AI draft values displayed
- [ ] All fields editable
- [ ] Changes tracked as user modifications
- [ ] Submit saves to InstantDB

#### Mobile
- [ ] Works on iOS Safari (HTTPS required)
- [ ] Works on Android Chrome
- [ ] Camera permission prompt appears
- [ ] Orientation changes handled

#### Data Integrity
- [ ] AI fields saved correctly
- [ ] Existing reports unaffected
- [ ] Photo uploaded and linked

---

## 8. Risks + Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| iOS camera permission issues | Medium | High | Clear instructions, fallback to file picker |
| Gemini API rate limits | Low | Medium | Free tier is generous; implement retry |
| AI accuracy insufficient | Medium | Medium | User review step catches errors |
| HTTPS requirement blocks local dev | Low | Low | Use localhost (exempt from HTTPS) |
| Image size too large for API | Medium | Medium | Compress before sending (existing code) |

---

## 9. Open Questions

1. **Compression**: Should we use existing `browser-image-compression` before AI analysis?
   - **Recommendation**: Yes, compress to ~1MB max to reduce API latency

2. **Offline handling**: Queue photos for later analysis?
   - **Recommendation**: Out of scope for v1; show error + manual fallback

3. **Multiple photos**: Allow multiple angles?
   - **Recommendation**: Out of scope; one photo per report for v1

4. **Cost monitoring**: Track API usage?
   - **Recommendation**: Log to console for now; add dashboard later

---

## 10. Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Camera + Quality Check | 4-6 hours | None |
| Phase 2: AI Integration | 4-6 hours | Gemini API key |
| Phase 3: Review Screen | 3-4 hours | Phase 2 |
| Phase 4: Integration + Polish | 4-6 hours | Phases 1-3 |
| **Total** | **15-22 hours** | |

---

## 11. Success Metrics

- **Completion rate**: % of users who complete camera flow vs abandon
- **AI accuracy**: % of AI suggestions not modified by user
- **Time to submit**: Average time from camera open to submission
- **Cost per report**: Track Gemini API costs

---

## 12. Handoff Notes

### For Developer Agent
1. Start with Phase 1 - get camera working first
2. Use existing image compression logic from `WalkabilityPrototypeModal`
3. Keep `WalkabilityPrototypeModal` working for edit mode
4. Test on real mobile device early (camera APIs differ from desktop)

### For Reviewer Agent
1. Verify camera works on iOS Safari specifically
2. Check AI response handling for edge cases (no sidewalk visible, etc.)
3. Ensure existing reports still load/display correctly
4. Review API route for security (no key exposure)

---

*Plan created: 2025-11-28*
*Last updated: 2025-11-28*

---

## 13. Photo Upload/Capture UX Enhancement

> **Added**: 2025-11-28
> **Status**: Planning
> **Goal**: Allow users to upload existing photos OR take new photos from the initial report flow

### 13.1 Current State

The existing photo section in `WalkabilityPrototypeModal.tsx` (lines 1190-1270) uses:
```html
<input type="file" accept="image/*" />
```

This already works cross-platform:
- **iOS**: Shows action sheet with "Take Photo" and "Photo Library" options
- **Android**: Shows chooser with camera and gallery apps
- **Desktop**: Opens file picker (no camera access)

**Current UX Issues**:
1. Single button doesn't clearly communicate both options
2. Desktop users can't use webcam at all
3. No visual distinction between "take photo" vs "upload" intent
4. The current react-webcam `CameraCapture.tsx` component is separate from the form flow

---

### 13.2 UX Pattern Options

#### Option A: Single Smart Button (Recommended for Mobile-First)
```
┌─────────────────────────────────┐
│  📷  Agregar Foto               │
│  Toma o selecciona una imagen   │
└─────────────────────────────────┘
```

**How it works**:
- Mobile: Uses `<input type="file" accept="image/*">` → OS shows camera/gallery choice
- Desktop: Opens file picker (standard behavior)

**Pros**:
- Minimal UI, leverages native OS patterns
- Users already understand their OS's photo picker
- No extra components needed

**Cons**:
- Desktop users can't use webcam
- Less control over camera experience

---

#### Option B: Two Distinct Buttons (Best for Desktop+Mobile)
```
┌──────────────────┐  ┌──────────────────┐
│  📸 Tomar Foto   │  │  📁 Subir Foto   │
└──────────────────┘  └──────────────────┘
```

**How it works**:
- "Tomar Foto":
  - Mobile: `<input type="file" accept="image/*" capture="environment">` → opens camera directly
  - Desktop: Opens react-webcam fullscreen component
- "Subir Foto":
  - All platforms: `<input type="file" accept="image/*">` → file picker

**Pros**:
- Clear intent for each action
- Desktop webcam support
- Consistent with existing `CameraCapture.tsx` component

**Cons**:
- More buttons = more cognitive load
- Android `capture` attribute skips gallery entirely

---

#### Option C: Primary + Secondary Pattern (Balanced)
```
┌─────────────────────────────────┐
│      📸  Tomar Foto             │  ← Primary (large)
│      Usa la cámara trasera      │
└─────────────────────────────────┘
        O subir desde galería ↗      ← Secondary (text link)
```

**How it works**:
- Primary button: Camera-first (react-webcam on desktop, `capture="environment"` on mobile)
- Secondary link: Standard file picker for gallery/uploads

**Pros**:
- Emphasizes camera-first UX (matches app's purpose)
- Clear hierarchy
- Works well for field data collection apps

**Cons**:
- Android `capture` attribute can't be overridden to also show gallery

---

#### Option D: Adaptive Single Button + Dropdown (Power User Friendly)
```
┌─────────────────────────────────┬───┐
│  📷  Agregar Foto               │ ▼ │
└─────────────────────────────────┴───┘
                    ┌─────────────────┐
                    │ 📸 Tomar Foto   │
                    │ 📁 Subir Foto   │
                    └─────────────────┘
```

**How it works**:
- Default tap: Opens native picker (mobile) or dropdown (desktop)
- Dropdown expands options explicitly

**Pros**:
- Clean default, power users can choose
- Works on all platforms

**Cons**:
- More complex implementation
- Extra tap for explicit choice

---

### 13.3 Platform-Specific Behavior Matrix

| Action | iOS Safari | Android Chrome | Desktop Chrome |
|--------|------------|----------------|----------------|
| `accept="image/*"` (no capture) | Shows "Take Photo" + "Photo Library" sheet | Shows app chooser (camera + gallery) | File picker only |
| `accept="image/*" capture="environment"` | Opens camera directly (iOS 10.3+) | Opens camera directly (no gallery option) | File picker only (capture ignored) |
| react-webcam | Works (requires HTTPS) | Works (requires HTTPS) | Works (requires HTTPS) |

**Key Insight**:
- iOS without `capture` attribute is ideal—gives both options natively
- Android with `capture` forces camera-only
- Desktop needs react-webcam for camera access

---

### 13.4 Recommended Implementation

**Strategy: Adaptive UX based on platform detection**

```typescript
// Detect if user is on mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Mobile: Use single input that shows native picker
// Desktop: Show two buttons (webcam + file upload)
```

#### Mobile UI:
```
┌─────────────────────────────────┐
│  📷  Agregar Foto               │
│  Toca para tomar o seleccionar  │
└─────────────────────────────────┘
```
→ Single `<input type="file" accept="image/*">` (no capture attribute)
→ iOS/Android show their native picker with camera + gallery options

#### Desktop UI:
```
┌──────────────────┐  ┌──────────────────┐
│  📸 Usar Cámara  │  │  📁 Subir Archivo│
└──────────────────┘  └──────────────────┘
```
→ "Usar Cámara" opens react-webcam fullscreen modal
→ "Subir Archivo" opens file picker

---

### 13.5 Implementation Plan

#### Files to Modify:
1. **`src/components/WalkabilityPrototypeModal.tsx`**
   - Add platform detection
   - Create adaptive photo section UI
   - Integrate with existing `CameraCapture.tsx` for desktop webcam

2. **`src/components/CameraCapture.tsx`** (existing)
   - Already handles fullscreen camera
   - May need minor props adjustment to work inline vs fullscreen

#### Code Changes:

```typescript
// Add to WalkabilityPrototypeModal.tsx

// Platform detection
const [isMobile, setIsMobile] = useState(false);
const [showWebcam, setShowWebcam] = useState(false);

useEffect(() => {
  setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
}, []);

// In the photo section JSX:
{!photoPreview && !isCompressing && (
  <>
    {isMobile ? (
      // Mobile: Single smart button
      <button
        type="button"
        onClick={handleOpenFilePicker}
        className="w-full border-2 border-dashed rounded-lg px-4 py-8 text-center"
      >
        <span className="text-4xl mb-2 block">📷</span>
        <span className="text-blue-600 font-medium">Agregar Foto</span>
        <p className="text-xs text-gray-500 mt-1">
          Toca para tomar una foto o seleccionar de la galería
        </p>
      </button>
    ) : (
      // Desktop: Two distinct buttons
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setShowWebcam(true)}
          className="flex-1 border-2 border-dashed rounded-lg px-4 py-6 text-center hover:border-blue-400"
        >
          <span className="text-3xl mb-1 block">📸</span>
          <span className="text-blue-600 font-medium text-sm">Usar Cámara</span>
        </button>
        <button
          type="button"
          onClick={handleOpenFilePicker}
          className="flex-1 border-2 border-dashed rounded-lg px-4 py-6 text-center hover:border-blue-400"
        >
          <span className="text-3xl mb-1 block">📁</span>
          <span className="text-blue-600 font-medium text-sm">Subir Archivo</span>
        </button>
      </div>
    )}
    {/* Hidden file input */}
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleFileChange}
    />
  </>
)}

{/* Desktop webcam modal */}
{showWebcam && (
  <CameraCapture
    onCapture={(imageData) => {
      // Convert base64 to File and process
      handleCapturedImage(imageData);
      setShowWebcam(false);
    }}
    onClose={() => setShowWebcam(false)}
  />
)}
```

---

### 13.6 Verification Checklist

#### Mobile Testing:
- [ ] iOS Safari: Tap shows "Take Photo" + "Photo Library" options
- [ ] Android Chrome: Tap shows app chooser with camera + gallery
- [ ] Photo taken from camera compresses correctly
- [ ] Photo selected from gallery compresses correctly
- [ ] Large photos (>10MB) show error message

#### Desktop Testing:
- [ ] Two buttons visible (Usar Cámara / Subir Archivo)
- [ ] "Usar Cámara" opens webcam modal
- [ ] Webcam capture works (HTTPS/localhost required)
- [ ] "Subir Archivo" opens file picker
- [ ] Drag-and-drop still works in the area

#### Cross-Platform:
- [ ] Photo preview displays correctly after capture/upload
- [ ] "Cambiar Foto" and "Quitar" buttons work
- [ ] Photo uploads to InstantDB correctly
- [ ] AI analysis receives the photo (if AI flow is active)

---

### 13.7 Sources & References

- [Uploadcare: File Uploader UX Best Practices](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [MDN: HTML capture attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture)
- [Stack Overflow: How to allow file picker AND camera capture on Android](https://gist.github.com/danawoodman/4788404bc620d5392d111dba98c73873)
- [Stack Overflow: Correct way to use input capture on mobile](https://stackoverflow.com/questions/51272463/correct-way-to-use-input-type-file-capture-on-mobile-devices)
- [freeCodeCamp: How to use input element to access camera on mobile](https://www.freecodecamp.org/news/how-to-use-input-element-to-access-camera-on-mobile/)
- [AddPipe: Correct Syntax for HTML Media Capture](https://blog.addpipe.com/correct-syntax-html-media-capture/)
- [SimiCart: How to Access Camera in a PWA](https://simicart.com/blog/pwa-camera-access/)
