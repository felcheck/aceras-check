# Research: Leaflet Tile Themes (2024-02-23)

Goal: identify alternative basemap styles we can plug into `MapView`'s `<TileLayer />` to replace the default OpenStreetMap Standard tiles.

## Quick Integration Notes
- Leaflet accepts any XYZ tile URL; swap `url` + `attribution` in `TileLayer`.
- Most providers require an API key; keep keys in `.env.local` and reference via `process.env` in the Next.js client component.
- Respect rate limits (tile providers may throttle heavy traffic). Cache decisions if we expect higher volume.

## Theme Candidates

| Provider / Style | Visual Traits | Tile URL Template | Licensing / Key |
| --- | --- | --- | --- |
| **OpenStreetMap Standard** | Default bright scheme; busy labels | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Free, no key (current setup) |
| **Carto Voyager** | Clean pastel city map with strong POI labeling | `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png` | Free for light usage (no key); attribution to OSM + Carto |
| **Carto Dark Matter** | Dark UI-friendly basemap, minimal distraction for markers | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` | Free; good for night mode |
| **Stamen Toner** | High-contrast black & white; emphasizes geometry | `https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png` | Attribution required; free for limited use |
| **Stamen Watercolor** | Artistic watercolor aesthetic for storytelling | `https://stamen-tiles.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg` | Attribution required; heavier tiles |
| **Thunderforest Transport** | Highlights transit lines, roads; good for mobility context | `https://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png?apikey=YOUR_KEY` | Requires API key (free tier w/ limits) |
| **Mapbox Streets** | Polished vector style (needs conversion via `react-leaflet` + `L.TileLayer`) | `https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=KEY` | Requires Mapbox token |
| **Esri World Imagery** | Satellite imagery for context on actual sidewalks | `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}` | Free with attribution |
| **Jawg Light** | Modern light basemap with subtle colors | `https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}.png?access-token=KEY` | Requires Jawg access token |
| **MapTiler Basic/Hybrid** | Crisp fonts, high legibility; multiple palettes | `https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=KEY` | Free tier (credit card after limits) |
| **Stadia Maps Alidade Smooth** | Highly legible Montserrat fonts; toned-down colors | `https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png?api_key=KEY` | Requires free API key (non-commercial tier) |
| **HERE Explore** | Corporate-grade fonts/icons, optimized for navigation | `https://{1-4}.${s}.maps.ls.hereapi.com/maptile/2.1/maptile/newest/explore.day/{z}/{x}/{y}/256/png8?apiKey=KEY` | Requires HERE API key |
| **TomTom Basic** | Strong contrast, readable fonts; shows traffic hierarchy clearly | `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=KEY` | Requires TomTom key |
| **OpenMapTiles Clear** | Vector tiles with clear typefaces; self-host or MapTiler Cloud | `https://maps.tilehosting.com/styles/basic/{z}/{x}/{y}.png?key=KEY` | Requires MapTiler key |

## Recommendation
- Prototype with **Carto Voyager** (clean, legible, no key) and **Carto Dark Matter** (night mode) to gauge readability over Panama City.
- Offer a simple basemap switcher later (light vs dark vs satellite) once we capture preference data.

## Next Steps
1. Swap the `<TileLayer url>` to Carto Voyager in a dev branch and gather screenshots for stakeholders.
2. Evaluate label density vs. report markers; adjust marker colors if needed.
3. If we want a long-term dark mode, add UI toggle and store preference.

## 2025-11-15 Readability Test Notes
- Setup: Unable to bind local dev servers inside the sandbox (`listen EPERM` on ports 3000/3100/3200), so I pulled the actual Carto Voyager + Dark Matter tiles covering the Bella Vista focus area (lat 8.983333, lng -79.51667) at zoom levels 14 and 16 via `curl` and inspected them with Pillow.
- Voyager findings:
  - Mean luminance 238 (std dev 12) with 5th percentile already at 227, so almost the entire canvas is a bright pastel. Marker halo remains visible but the default Leaflet blue (`#2e85cb`) only achieves ~3.1:1 contrast against the dominant background color (`#d5e8eb`), which is below WCAG AA for non-large graphics.
  - POI/road labels (dark gray) pop well, but the light beige land parcels reduce separation between low-severity markers; adding a darker outline or swapping to an amber marker icon would help.
- Dark Matter findings:
  - Mean luminance 19 (std dev 14) and a 95th percentile of 38 at z14, so it is genuinely dark with plenty of headroom for colored markers. Default marker contrast vs. background is ~5:1, so pins read clearly even before we invert the icon.
  - Label density is lower, which helps focus on the reports, but white text on near-black asphalt may need a subtle halo to avoid blooming when zoomed out.
- Both providers served identical imagery from the `a.basemaps.cartocdn.com` tile server without throttling, so once we can spin up real dev servers we should still capture qualitative screenshots for the team; meanwhile these numeric checks confirm Dark Matter is safer for accessibility, and Voyager needs marker color tweaks before shipping as the default.
