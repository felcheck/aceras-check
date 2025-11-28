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
