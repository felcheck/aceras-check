# Plan: Walkability Intake Criteria & Prioritization (2024-02-23)

## Overview
Solidify the qualitative questions gathered from the prototype pilot (UTILIDAD, SEGURIDAD, COMODIDAD, INTERESANTE) so we can design a structured intake form that maps to actionable data. The goal is to define each criterion, propose how to capture it (data type, UI pattern, scoring), and rank the implementation order for the next development cycles.

## Objectives
1. Translate each Spanish-language criterion into concrete fields and scoring logic for the InstantDB schema and UI.
2. Identify dependencies (e.g., geospatial lookups, rating widgets, optional media) that affect effort.
3. Prioritize criteria so we know which ones to build first when revising `AddReportForm`.

## Current Prototype vs. Desired Intake
- Prototype form: ad-hoc category + free text + severity slider + optional ratings (condition/width/safety/lighting/accessibility). These do not map 1:1 to the civic questions above.
- Desired intake: capture neighborhood accessibility via the four buckets below, each with specific prompts. Some overlap with prototype fields (lighting, accessibility), but others (travel time to amenities, qualitative vibes) need new data structures.

## Criteria Breakdown
| Bucket | Question | Data Type / Input | Notes & Dependencies |
| --- | --- | --- | --- |
| **UTILIDAD** | ¿A cuántos lugares puedo llegar en un radio de 10-15 minutos caminando? | Composite metric (0-5) or checklist per amenity | Could expose 5 toggles (Parque, Supermercado, Hospital/Clínica, Tiendas/Restaurantes, Trabajo/Escuela). Requires user perception; no external routing yet. |
| | Parque | Boolean toggle + optional note | Maybe `amenities.parqueNearby = true/false`. |
| | Supermercado | Boolean toggle | |
| | Hospital/Clínica | Boolean toggle | |
| | Tiendas/Restaurantes | Boolean toggle | |
| | Trabajo/Escuela | Boolean toggle | |
| **SEGURIDAD** | ¿Existe la acera? | Boolean + optional photo | Already partially covered by `category` (missing sidewalk). Need explicit `hasSidewalk`. |
| | ¿Es lo suficientemente amplia...? | Rating 1-5 or categorical (sí/no) | Align with current `widthRating` but rename/clarify copy. |
| | ¿Hay huecos/interrupciones/carros mal estacionados? | Multi-select checklist + notes | Could map to categories (broken pavement, obstruction) but also capture a checklist for severity. |
| | ¿Es de un buen tamaño relativo a la carretera? | Likert 1-5, maybe `comfortSpaceRating`. |
| | ¿Hay luminaria? | Boolean + optional rating for brightness; currently `lightingRating`. |
| **COMODIDAD** | ¿Hay árboles o algo que cubra del sol/lluvia? | Boolean or 1-5 shade rating | Introduce `shadeRating`. |
| | ¿Se percibe algún tipo de contaminación? | Multi-select (basura, olores, humo, ruido) + severity slider | Could be stored as string array + severity numeric. |
| **INTERESANTE** | ¿Hay comercios en las plantas bajas? | Boolean + count or note | Helps measure active frontage. |
| | Punto vibras (¿te parece interesante?) | Simple emoji/1-5 rating | For storytelling; low effort. |

## Scoring Logic (Walkability Points)
Use the `(current/max)` labels to normalize how much each bucket contributes to the overall walkability score. Store both raw responses and the computed point contribution so dashboards can show qualitative + numeric data side by side.

- **UTILIDAD (1 point total)**  
  - Toggle list (parque, supermercado, hospital/clinica, tiendas/restaurantes, trabajo/escuela). Grant **0.2 points** per amenity marked reachable within 10-15 minutes. Cap at 1.0.
  - Optional: capture confidence (sure/unsure) but only score when the reporter selects “sure.”

- **SEGURIDAD (5 points total)**  
  1. `hasSidewalk` true → **1 point**; false → 0.  
  2. `widthRating` (1-5): ≥4 → 1 point, 3 → 0.5, ≤2 → 0.  
  3. Obstruction checklist (huecos, interrupciones, carros mal estacionados): start at 1 point and subtract 0.25 for each selected obstruction down to 0.  
  4. `comfortSpaceRating` (perception of buffer from cars): ≥4 → 1 point, 3 → 0.5, else 0.  
  5. Lighting: boolean `hasLighting` + `lightingRating`. If lighting exists and rating ≥4 → 1 point, rating 2-3 → 0.5, else 0.

- **COMODIDAD (2 points total)**  
  1. Shade coverage (`shadeRating` or boolean). Full shade → 1 point, partial shade → 0.5, none → 0.  
  2. Contamination multi-select (basura, olores, humo, ruido) + severity slider. Start at 1 point, subtract 0.3 for each pollutant flagged (minimum 0). Severity slider can reduce a further 0.2 if “muy fuerte.”

- **INTERESANTE (2 points total)**  
  1. Ground-floor commerce present → 1 point; add 0.5 bonus if reporter counts ≥3 distinct businesses (cap bucket at 2 total).  
  2. “Punto vibras” rating: normalize 1–5 to 0–1 (rating ÷ 5) and multiply by 1 point. Example: vibe rating 4 → 0.8 points.  
  - Cap INTERESANTE subtotal at 2 points.

## Prioritization Rationale
1. **SEGURIDAD** – core mission; some fields already exist (condition, width, lighting), so incremental effort is lower. Enables safety-focused metrics quickly.
2. **UTILIDAD** – high civic value but needs new schema (amenity toggles). Implement after safety because it influences routing/analysis but not immediate hazard reporting.
3. **COMODIDAD** – medium complexity; adds shade/contamination toggles, helpful for comfort scores but less critical than basic safety.
4. **INTERESANTE** – lowest risk/effort; can ship alongside COMODIDAD for richer storytelling once essentials are done.

## Implementation Notes
- Map these fields to new schema sections (e.g., nested JSON stored as objects in InstantDB or flattened columns like `hasShade`, `noiseLevel`). Need a follow-up schema design doc.
- UI should group questions per bucket with localized copy (Spanish prompts + icons).
- Ratings should reuse the existing star slider component where possible to reduce UI debt.
- Consider storing aggregated scores (e.g., `utilidadScore`) for easier filtering later, computed from selected amenities.

## Walkability Input – Drawer Interaction Concepts
When the user taps “Reportar problema aquí” in the map drawer, the sheet should transition from the bottom anchor to the top (roughly 90% height on mobile, centered modal on desktop) so the four scoring buckets feel like a full-screen form. Below are three responsive design alternatives that still honor UTILIDAD / SEGURIDAD / COMODIDAD / INTERESANTE scoring:

1. **Stacked Accordion Buckets**
   - **Structure**: Once the button is tapped, the drawer animates upward and expands. Each bucket becomes an accordion card with an icon + score badge. Only one card is open at a time. Tapping the header scrolls the open section into view.
   - **Scoring UI**: Inside each card, include the relevant toggles/sliders (e.g., UTILIDAD amenity toggles, SEGURIDAD checklist). A tiny “Pts” chip beside the header updates live (e.g., `SEGURIDAD · 3.5/5`).
   - **Responsiveness**:  
     - *Mobile*: Full-height sheet with sticky progress bar at the top showing total walkability points. Accordions vertically stacked; headers occupy 56px each for easy thumb taps.  
     - *Desktop*: Sheet docks to the top-center with a two-column layout for the open accordion’s content while the closed cards remain on the left. Clicking another card slides the form horizontally rather than scrolling the entire page.

2. **Stepper with Bucket Tabs**
   - **Structure**: Drawer transitions to a top-aligned modal and transforms into a four-step wizard. Horizontal pill tabs (UTILIDAD, SEGURIDAD, etc.) appear beneath the header. Users advance with “Siguiente” / “Volver” and see a completion indicator (e.g., “Paso 2 de 4”).
   - **Scoring UI**: Each step focuses on one bucket with concise controls; the footer shows the bucket’s subtotal plus the running total. Completed tabs get a check mark and display their earned points.
   - **Responsiveness**:  
     - *Mobile*: Tabs become a swipeable segment at the top; we keep only one bucket per view with large next/back buttons spanning the width.  
     - *Desktop*: Tabs stretch across the modal header, allowing direct navigation by clicking any bucket. Form fields can live in a two-column grid since there’s more width.

3. **Dual-Pane Scoreboard**
   - **Structure**: Pressing the button opens a top-docked drawer that splits into two panes: left pane is a vertical score summary (four colored bars, each showing points earned), right pane is a scrollable form grouped by bucket. Clicking a score bar scrolls the right pane to the corresponding question group.
   - **Scoring UI**: As the user toggles inputs, the left scoreboard animates the point gain (e.g., UTILIDAD bar fills toward 1.0). Hover tooltips on desktop explain how many points remain.
   - **Responsiveness**:  
     - *Mobile*: Panes stack — scoreboard is sticky at the top while the form scrolls beneath it. Bars compress into cards with mini progress circles to keep vertical space manageable.  
     - *Desktop*: Two panes sit side-by-side (30% / 70%). On large screens the scoreboard stays fixed while the form scrolls, giving a dashboard-like feel without modal hopping.

All three options keep the “drawer moves to the top” requirement while ensuring consistency between touch and pointer devices. We can prototype the accordion first (closest to current sheet UI) and evaluate if the stepper or dual-pane layout better communicates walkability points once more questions are added.

## Next Steps
1. Draft schema changes proposal referencing this plan (new InstantDB fields, enums, link updates).
2. Update `AddReportForm` wireframes/copy to reflect Spanish prompts and grouping.
3. Sequence work: first deliver SEGURIDAD enhancements in code, then UTILIDAD toggles, followed by COMODIDAD + INTERESANTE.
4. Align verification criteria (manual QA flows) once the schema/UI specs are locked.
