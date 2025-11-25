# Photo Compression Research for Panama LTE Networks (2025-11-25)

## Executive Summary
**Recommendation: YES, implement client-side compression**

Based on Panama's mobile network conditions and modern smartphone photo sizes, client-side compression is essential for optimal user experience. Average uncompressed smartphone photos (3-9MB) would take 1-3 seconds to upload on Panama's LTE networks, and compression can reduce this by 50-80%.

---

## Panama Mobile Network Context (2025)

### Current Network Performance
- **Median mobile download speed**: 27.23 Mbps (up 47.1% from 2024)
- **Network coverage**: 88.2% of connections are 4G/LTE or better
- **Urban performance**: Several tens of Mbps in Panama City
- **5G availability**: Active 5G in parts of Panama City (Más Móvil)

### Major Operators
1. **Más Móvil** (Cable & Wireless Panama) - Largest network, wide rural coverage
2. **Tigo** - Comparable urban coverage, widespread LTE

### Real-World Upload Performance
- **27 Mbps = ~3.4 MB/s** theoretical upload
- **Actual upload speeds**: Typically 20-40% of download speed = **5-10 Mbps (~0.6-1.25 MB/s)**
- **6MB photo upload time**: 5-10 seconds on average LTE
- **After compression to 800KB-1.5MB**: 1-2 seconds

**User Experience Impact:**
- 53% of users abandon sites/apps that take >3 seconds to load
- Multiple photos compound delays exponentially
- Network congestion in urban areas can slow speeds significantly

---

## Smartphone Photo Characteristics (2025)

### Typical File Sizes
- **Average JPEG**: 3-9 MB (average ~6 MB)
- **12MP camera**: ~3 MB JPEG
- **High-end phones**: 4-8 MB due to HDR, high resolution
- **HEIF format**: ~50% smaller than JPEG (~1.5-4.5 MB)

### Common Dimensions
- **Standard**: 4000x3000 pixels (12MP)
- **High-end**: 4K or higher resolutions

### Factors Increasing Size
- HDR processing
- Low-light computational photography
- High compression quality settings
- Detailed scenes with high complexity

---

## Compression Benefits

### File Size Reduction
- **WebP format**: 25-34% smaller than JPEG
- **AVIF format**: ~50% smaller than JPEG
- **Quality 80-85% JPEG**: 40-60% size reduction with minimal visual loss
- **Dimension reduction** (e.g., 4000px → 1920px): 75% size reduction

### Performance Impact
- Images account for 60-70% of typical web app weight
- Compression is the #1 performance optimization opportunity
- 1-3 second upload vs 5-10 second upload significantly impacts UX

### Recommended Approach
1. **Max dimension**: 1920px (sufficient for full-screen viewing)
2. **Quality**: 80-85% for JPEG/WebP
3. **Format**: WebP with JPEG fallback
4. **Target size**: 500KB - 1.5MB (down from 3-9MB)
5. **Strip EXIF**: Remove metadata unless geolocation needed

---

## Client-Side Compression Libraries (2025)

### Top Candidates

#### 1. **browser-image-compression** ⭐ RECOMMENDED
- **Size**: Medium (~15KB minified)
- **Features**:
  - Uses OffscreenCanvas for non-blocking compression
  - Falls back to main thread if unsupported
  - Simple async API
  - Active maintenance (2025)
- **API Example**:
  ```javascript
  import imageCompression from 'browser-image-compression';

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  const compressedFile = await imageCompression(file, options);
  ```
- **Install**: `npm install browser-image-compression`

#### 2. **Compressor.js**
- **Size**: ~5KB minified (very lightweight)
- **Features**:
  - Uses native canvas.toBlob API
  - Lossy compression only
  - Quality control (0-1 scale)
  - TypeScript support
- **API Example**:
  ```javascript
  import Compressor from 'compressorjs';

  new Compressor(file, {
    quality: 0.8,
    maxWidth: 1920,
    success(result) { /* compressed file */ },
  });
  ```
- **Install**: `npm install compressorjs`

#### 3. **js-image-compressor**
- **Size**: ~5KB (extremely lightweight)
- **Features**:
  - Minimalist library
  - Front-end only
  - Simple quality control
- **Best for**: Projects prioritizing minimal bundle size

### Library Comparison

| Library | Size | Non-blocking | Ease of Use | Maintenance |
|---------|------|--------------|-------------|-------------|
| browser-image-compression | ~15KB | ✅ Yes | ⭐⭐⭐⭐⭐ | Active 2025 |
| Compressor.js | ~5KB | ❌ No | ⭐⭐⭐⭐ | Active 2025 |
| js-image-compressor | ~5KB | ❌ No | ⭐⭐⭐ | Less active |

---

## Implementation Recommendations

### For Aceras Check (1 Photo Per Report)

#### Option A: browser-image-compression (Recommended)
**Pros:**
- Non-blocking compression via Web Worker
- Simple async/await API
- Reliable, well-maintained
- Good balance of features vs size

**Cons:**
- Slightly larger bundle (~15KB)

**Configuration:**
```javascript
const options = {
  maxSizeMB: 1,              // Target 1MB max
  maxWidthOrHeight: 1920,     // Good for mobile displays
  useWebWorker: true,         // Non-blocking
  fileType: 'image/jpeg',     // Consistent output format
};
```

#### Option B: Compressor.js (Lightweight Alternative)
**Pros:**
- Tiny bundle size (~5KB)
- Native browser API
- TypeScript support

**Cons:**
- Blocks main thread during compression
- Callback-based API (less modern)

**Configuration:**
```javascript
new Compressor(file, {
  quality: 0.85,
  maxWidth: 1920,
  mimeType: 'image/jpeg',
  convertSize: 1000000, // Convert to JPEG if >1MB
});
```

---

## Recommended Compression Strategy

### For Single Photo Upload (Aceras Check)

```javascript
// Target specs for Panama LTE networks
const PHOTO_CONFIG = {
  maxSizeMB: 1.0,           // 1MB target (down from 3-9MB)
  maxWidthOrHeight: 1920,   // Full HD, good for all displays
  quality: 0.85,            // Minimal visual loss
  useWebWorker: true,       // Non-blocking
  fileType: 'image/jpeg',   // Consistent format
};

// Expected results:
// - Original: 3-9 MB, 5-10s upload
// - Compressed: 0.8-1.5 MB, 1-2s upload
// - Size reduction: ~75-85%
// - Upload time reduction: ~80%
```

### User Experience Flow

1. **User captures/selects photo** → Show preview
2. **Compress in background** → Show "Procesando foto..." (0.5-2s)
3. **Upload compressed file** → Show "Subiendo foto..." (1-2s)
4. **Total time**: 2-4 seconds vs 5-10 seconds uncompressed

### Why This Matters for Panama

- **Network variability**: Rural areas have slower speeds
- **Data costs**: Many users on limited prepaid data plans
- **User retention**: Faster uploads = better UX = more reports
- **Battery life**: Shorter upload time = less battery drain

---

## Technical Considerations

### Format Support (2025)
- **JPEG**: Universal support, good compression
- **WebP**: 95%+ browser support, better compression
- **AVIF**: Growing support, best compression (but encoding slower)
- **HEIC**: iOS native, but limited web support

**Recommendation**: Stick with JPEG output for maximum compatibility

### EXIF Data
- **Contains**: Camera model, timestamp, GPS, orientation
- **Size impact**: 5-50KB typically
- **Recommendation**: Strip EXIF unless you need GPS data
  - Pro: Smaller files, privacy-friendly
  - Con: Lose automatic orientation correction

### Canvas API Limitations
- Max dimension varies by browser (~8000-16000px)
- Memory constraints on older devices
- Not a concern for 1920px target

### Progressive Enhancement
- Detect browser support for Canvas API
- Fallback: Upload uncompressed if compression fails
- Show appropriate error messages

---

## Implementation Checklist

- [ ] Install `browser-image-compression` package
- [ ] Add compression before upload in AddReportForm
- [ ] Configure: 1MB max, 1920px max dimension, 85% quality
- [ ] Show compression progress: "Procesando foto..."
- [ ] Show upload progress: "Subiendo foto..."
- [ ] Test on 3MB, 6MB, and 9MB photos
- [ ] Test on slow network (Chrome DevTools throttling)
- [ ] Measure before/after file sizes
- [ ] Measure before/after upload times
- [ ] Verify image quality acceptable
- [ ] Handle compression errors gracefully

---

## Benchmarks (Expected)

| Scenario | Original Size | Compressed Size | Reduction | Upload Time (27 Mbps LTE) |
|----------|--------------|-----------------|-----------|---------------------------|
| Standard | 3 MB | 0.8 MB | 73% | 2s → 0.5s |
| Average | 6 MB | 1.2 MB | 80% | 4s → 1s |
| High-end | 9 MB | 1.5 MB | 83% | 6s → 1.2s |

**Total UX improvement**: 4-5 second reduction per photo upload

---

## References
- InstantDB Storage Docs: https://www.instantdb.com/docs/storage
- browser-image-compression: https://www.npmjs.com/package/browser-image-compression
- Compressor.js: https://fengyuanchen.github.io/compressorjs/
- Panama Digital 2025 Report: https://datareportal.com/reports/digital-2025-panama
- Image Compression Guide 2025: https://www.imgcraftlab.com/blog/complete-image-compression-guide-2025

---

## Decision

✅ **Implement client-side compression using browser-image-compression**

**Rationale:**
1. Panama LTE speeds (27 Mbps) make 6MB uploads tolerable but not optimal
2. Network variability requires optimization for worst-case scenarios
3. 75-85% file size reduction with minimal quality loss
4. Non-blocking compression maintains responsive UI
5. Small bundle size cost (~15KB) justified by UX improvement
6. Users on limited data plans benefit from reduced usage
7. One photo per report keeps implementation simple

**Expected Impact:**
- Upload time: 5-10s → 1-2s (80% reduction)
- File size: 3-9MB → 0.8-1.5MB (75-85% reduction)
- User satisfaction: Significantly improved perceived performance
