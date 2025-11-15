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

## Recommendation
- Prototype with **Carto Voyager** (clean, legible, no key) and **Carto Dark Matter** (night mode) to gauge readability over Panama City.
- Offer a simple basemap switcher later (light vs dark vs satellite) once we capture preference data.

## Next Steps
1. Swap the `<TileLayer url>` to Carto Voyager in a dev branch and gather screenshots for stakeholders.
2. Evaluate label density vs. report markers; adjust marker colors if needed.
3. If we want a long-term dark mode, add UI toggle and store preference.
