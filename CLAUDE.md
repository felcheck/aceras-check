# Aceras Check - Panama Walkability Project

## Product Requirements Document (PRD)

**Status**: In Development
**Date**: 2025-11-12
**Focus Areas**: Bella Vista Viejo & El Cangrejo, Panama City

---

## 1. Project Overview

### Mission
Create a crowdsourced walkability rating tool for Panama City to:
- Document pedestrian infrastructure conditions
- Prioritize which sidewalks/areas need fixing first
- Generate data where official/OSM data is lacking
- Not-for-profit community project

### Target Neighborhoods (Pilot)
1. **Bella Vista Viejo** - Calle 42-47, Zona de Calle Uruguay
2. **El Cangrejo** - Bounded by Vía España, Transístmica, Av. Manuel Espinosa, Vía Brasil

### Key Problem Statement
Panama City has severe walkability issues:
- 32.45% of pedestrian network is fragmented
- Business encroachments are #1 cause of obstruction
- Sidewalks used for parking, poor condition
- 46.79% of bus stop distances to crossings exceed 100m
- Limited OSM pedestrian data in LATAM

---

## 2. User Personas

### Primary: The Mapper
- Local resident or volunteer
- Walks through neighborhoods
- Uses web app to report conditions in real-time
- Provides: ratings, photos, observations, GPS location

### Secondary: Data Consumer
- City planners, advocacy groups, researchers
- Views aggregated walkability scores
- Identifies priority areas for infrastructure investment

---

## 3. Core Features (v1 - MVP)

### 3.1 Mapper App Functionality
- [x] **Map-based interface** showing current location
- [ ] **Drop pins** on problematic areas
- [ ] **Report types**:
  - Missing sidewalk
  - Narrow sidewalk
  - Broken pavement
  - Obstruction (vehicles, vendors, construction, business encroachment)
  - Missing crossing
  - Poor lighting
  - Safety concern
  - Accessibility issue
  - Positive feedback
- [ ] **Quick ratings** (1-5 stars):
  - Sidewalk condition
  - Sidewalk width
  - Safety
  - Lighting
  - Accessibility (wheelchair)
- [ ] **Photo upload**
- [ ] **Location auto-capture** (GPS)
- [ ] **Address geocoding** (search by address)

### 3.2 Visualization/Dashboard
- [ ] List view of all reports
- [ ] Filter by neighborhood, issue type
- [ ] Prioritization ranking (which areas to fix first)

### 3.3 Data Export
- [ ] Export to CSV for analysis
- [ ] Contribute back to OpenStreetMap (optional, future)

---

## 4. Technical Architecture

### 4.1 Tech Stack

**Frontend:**
- **Next.js** (React framework)
  - Server-side rendering for performance
  - Web app + PWA for mobile-like experience

**Database:**
- **InstantDB**
  - Real-time sync (perfect for mappers seeing each other's reports)
  - Easy auth and permissions
  - Built-in reactivity
  - File storage for photos

**Mapping:**
- **Leaflet + React-Leaflet** - Open-source map rendering
- **OpenStreetMap** base tiles (free, no API key)
- **Nominatim API** - Free geocoding (address → coordinates)
- **Browser Geolocation API** - GPS positioning

**Hosting:**
- Vercel (Next.js native, free tier generous)

---

## 5. Geolocation Map Application Implementation Plan

### Architecture Overview

- **Map Library**: Leaflet + React-Leaflet (most popular open-source map library)
- **Map Tiles**: OpenStreetMap (free, no API key required)
- **Geocoding**: Nominatim API (free OpenStreetMap geocoding service)
- **Geolocation**: Browser Geolocation API
- **Database**: InstantDB (for pins, metadata, and photos)

---

### Step-by-Step Implementation

#### 1. Dependencies (✅ COMPLETED)

```bash
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

**Note**: Turf.js is NOT included in MVP. It will be added in Phase 3 (Future Enhancements) for OSM road network integration and client-side spatial matching.

#### 2. InstantDB Schema (✅ COMPLETED)

**Entities:**
- `neighborhoods` - Bella Vista Viejo, El Cangrejo boundaries
- `reports` - User-submitted walkability reports with:
  - `category` (string, indexed) - Report type
  - `conditionRating`, `widthRating`, `safetyRating`, `lightingRating`, `accessibilityRating` (numbers, 1-5)
  - `description` (string) - User notes
  - `severity` (number, 1-5)
  - `lat`, `lng` (numbers) - GPS coordinates from click or geolocation
  - `roadId`, `roadName`, `distanceFromRoad` (optional) - Reserved for Phase 3 (OSM integration)
  - `status` (string, indexed) - pending/verified/resolved
  - `verified` (boolean)
  - `createdAt`, `updatedAt` (numbers)

**Links:**
- `reports` → `$users` (author)
- `reports` → `neighborhoods`
- `reports` → `$files` (photos)

#### 3. Component Structure

```
src/
├── components/
│   ├── MapView.tsx              # Main Leaflet map with markers (✅ DONE)
│   ├── AddReportForm.tsx        # Form to add new reports
│   ├── ReportDetails.tsx        # View/edit report modal
│   ├── AddressSearch.tsx        # Nominatim geocoding search
│   ├── PhotoUpload.tsx          # Photo upload component
│   └── ReportList.tsx           # Sidebar list of reports
└── app/
    └── page.tsx                 # Main app layout (✅ DONE)
```

#### 4. Implementation Phases

**Phase 1: Basic Map Display (✅ COMPLETED)**
- ✅ Initialize Leaflet map with OpenStreetMap tiles
- ✅ Set default center on Panama City
- ✅ Add zoom controls and responsive container
- ✅ Display existing report markers with popups

**Phase 2: Geolocation (NEXT)**
- [ ] Add "Use My Location" button
- [ ] Request browser geolocation permission
- [ ] Center map on user's coordinates
- [ ] Add marker at user's location

**Phase 3: Address Geocoding**
- [ ] Create search input component
- [ ] Call Nominatim API to convert address → coordinates
- [ ] Display search results with suggestions
- [ ] Pan map to selected location

**Phase 4: Add New Reports**
- [ ] Click map to open "Add Report" form at clicked coordinates
- [ ] Form fields: category, ratings (1-5), description
- [ ] Photo upload using InstantDB Storage
- [ ] Save to InstantDB using `db.transact()`
- [ ] Display success confirmation

**Phase 5: View/Edit/Delete Reports**
- [ ] Click marker to open details modal
- [ ] Display: category, ratings, description, photos, timestamp
- [ ] Edit button → enable form editing
- [ ] Delete button → confirm and remove from database

**Phase 6: Report Categories & Filters**
- [ ] Implement all report category types
- [ ] Filter reports by category
- [ ] Filter by neighborhood
- [ ] Sort by date, severity, status

**Phase 7: Responsive Design**
- [ ] Mobile: full-screen map with floating action button
- [ ] Tablet: side-by-side map and list
- [ ] Desktop: sidebar with report list + main map area
- [ ] Touch-friendly controls

---

### 5. Data Flow

```
User Input → Nominatim/Geolocation/Manual Click
     ↓
AddReportForm validates & structures data
     ↓
InstantDB Storage (photos) + Transaction (report + links)
     ↓
InstantDB Database (persisted)
     ↓
Realtime WebSocket push to all clients
     ↓
db.useQuery() receives update
     ↓
React re-renders
     ↓
MapView + Sidebar display updated pins
```

---

### 6. Key Implementation Notes

- **No authentication required** - All reports are public
- **InstantDB provides realtime updates** - Automatic sync across clients
- **Use `id()` helper** for generating report UUIDs
- **Index key fields** for efficient queries (category, status, createdAt)
- **Store photos in InstantDB Storage** and link to reports
- **Handle geolocation permission denial** gracefully
- **Nominatim rate limits** (1 req/sec) - debounce search input
- **Mobile-first design** - Most mappers will use phones

---

### 7. Report Categories

```typescript
const REPORT_CATEGORIES = [
  'missing_sidewalk',
  'narrow_sidewalk',
  'broken_pavement',
  'obstruction_vehicle',
  'obstruction_vendor',
  'obstruction_construction',
  'obstruction_business',
  'missing_crossing',
  'poor_lighting',
  'safety_concern',
  'accessibility_issue',
  'positive_feedback',
];
```

---

## 8. Success Metrics

- [ ] 100 reports in pilot neighborhoods within first month
- [ ] Minimum 5 reports per major street
- [ ] Identify top 20 priority areas for improvement
- [ ] Present findings to Junta Comunal de Bella Vista

---

## 9. Future Enhancements (Post-MVP)

### Phase 2 Features:
- User authentication (optional accounts)
- Upvote/downvote reports
- Comments on reports
- Heat map visualization
- Offline mode with service workers
- Push notifications for nearby issues

### Phase 3 Features:
- OSM road network integration (static GeoJSON)
- Client-side road matching with Turf.js
- Snap pins to nearest road segment
- Calculate walkability scores per street
- OSM data contribution workflow

### Advanced Features:
- Mobile native app (React Native)
- Admin moderation panel
- Data export API
- Integration with city planning tools
- Automated reporting to authorities

---

## 10. Current Status

### ✅ Completed:
1. InstantDB schema designed and pushed
2. Next.js project structure set up
3. Leaflet + React-Leaflet installed
4. Basic map view with OpenStreetMap
5. Report markers with popups
6. Real-time presence tracking

### 🚧 In Progress:
- Geolocation button
- Add report form

### 📋 Next Up:
- Address geocoding search
- Photo upload
- Report filtering
- Mobile responsive design
