# PWA Icons - Generation Needed

## Required Icons

1. **icon-192.png** (192x192px)
2. **icon-512.png** (512x512px)
3. **apple-touch-icon.png** (180x180px, optional but recommended)

## Quick Generation Options

### Option 1: PWA Icon Generator (Recommended)
Visit: https://www.pwabuilder.com/imageGenerator

1. Upload a square logo or create simple design
2. Select "Generate icons for PWA"
3. Download icon-192.png and icon-512.png
4. Place in `/public/` directory

### Option 2: Canva (Free)
1. Create 512x512px canvas
2. Background: #1e40af (blue)
3. Text: "AC" or "🚶" in white, centered
4. Export as PNG at 512x512
5. Resize to 192x192 for second file

### Option 3: Favicon.io
Visit: https://favicon.io/favicon-generator/

1. Text: "AC"
2. Background: #1e40af
3. Font: Bold
4. Generate and download
5. Rename files to icon-192.png and icon-512.png

## Temporary Workaround

For now, the manifest is configured but icons are missing. The app will still work in browser mode with safe area insets. PWA installation will be available once icons are added.

## Design Specs

**Recommended Design**:
- Background: #1e40af (blue-600, matches app theme)
- Text/Icon: White (#ffffff)
- Content: "AC" or walking icon
- Style: Bold, modern, simple
- Padding: 10-15% margin around content

**Maskable Icon** (icon-512.png):
- Keep critical content in center "safe zone" (80% diameter circle)
- Allow background to extend to edges
- Will be masked to various shapes by iOS
