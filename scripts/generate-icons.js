#!/usr/bin/env node

/**
 * Generate PWA icons for Aceras Check
 * Creates simple text-based icons with "AC" branding
 */

const fs = require('fs');
const path = require('path');

// Icon configuration
const BRAND_COLOR = '#1e40af'; // blue-600
const TEXT_COLOR = '#ffffff';
const ICON_TEXT = 'AC';

// Generate SVG for a given size
function generateSVG(size) {
  const fontSize = Math.floor(size * 0.5); // 50% of icon size
  const textY = size * 0.62; // Center text vertically (accounting for baseline)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${BRAND_COLOR}" rx="${size * 0.15}"/>
  <text
    x="50%"
    y="${textY}"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="${fontSize}"
    font-weight="bold"
    fill="${TEXT_COLOR}"
    text-anchor="middle"
    dominant-baseline="middle"
  >${ICON_TEXT}</text>
</svg>`;
}

// Icon sizes needed
const sizes = [
  { size: 192, name: 'icon-192.svg' },
  { size: 512, name: 'icon-512.svg' },
  { size: 180, name: 'apple-touch-icon.svg' }
];

// Output directory
const publicDir = path.join(__dirname, '../public');

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG files
sizes.forEach(({ size, name }) => {
  const svg = generateSVG(size);
  const filePath = path.join(publicDir, name);
  fs.writeFileSync(filePath, svg, 'utf8');
  console.log(`✓ Generated ${name} (${size}x${size})`);
});

console.log('\n✓ All SVG icons generated!');
console.log('\nNext steps:');
console.log('1. Convert SVG to PNG using an online tool or ImageMagick');
console.log('2. For now, SVG files will work in modern browsers');
console.log('3. Replace with PNG files when possible for better compatibility');
console.log('\nAlternatively, you can use these SVG files directly in the manifest.');
