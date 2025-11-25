import { test, expect } from '@playwright/test';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// Create a test image file
async function createTestImage(filepath: string, sizeMB: number = 2) {
  // Create a simple PNG image (1x1 pixel, then pad to desired size)
  const minimalPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth, color type, etc
    0x1f, 0x15, 0xc4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0a, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
    0x0d, 0x0a, 0x2d, 0xb4, // IDAT data + CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4e, 0x44, // IEND
    0xae, 0x42, 0x60, 0x82  // CRC
  ]);

  // Pad to desired size
  const targetSize = sizeMB * 1024 * 1024;
  const padding = Buffer.alloc(Math.max(0, targetSize - minimalPng.length), 0);
  const fullBuffer = Buffer.concat([minimalPng, padding]);

  await pipeline(
    Readable.from(fullBuffer),
    createWriteStream(filepath)
  );
}

test.describe('Photo Upload Feature', () => {
  test.beforeAll(async () => {
    // Create test images of different sizes
    await createTestImage(path.join(__dirname, 'test-2mb.png'), 2);
    await createTestImage(path.join(__dirname, 'test-6mb.png'), 6);
  });

  async function openReportForm(page: any) {
    await page.goto('/');

    // Wait for app to load (check for header or loading to complete)
    await page.waitForSelector('text=Loading...', { state: 'hidden', timeout: 15000 }).catch(() => {});

    // Wait for map to be ready
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(1000); // Let map fully initialize

    // Click on map to select location
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });

    // Wait for drawer to appear with "Chequear Acera Aquí" button
    await page.waitForTimeout(500);

    // Click the expand button to open full form
    const expandButton = page.locator('button:has-text("Chequear Acera Aquí")');
    await expandButton.click({ timeout: 5000 });

    // Wait for expanded form header
    await page.waitForSelector('text=Nuevo Chequeo de Acera', { timeout: 5000 });
  }

  test('should display photo upload UI', async ({ page }) => {
    await openReportForm(page);

    // Check photo upload section exists
    await expect(page.locator('text=📸 Foto del Problema (opcional)')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=+ Tomar/Subir Foto')).toBeVisible();
  });

  test('should compress and show preview for 2MB photo', async ({ page }) => {
    await openReportForm(page);

    // Listen for console logs
    const compressionLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Original photo:') || msg.text().includes('Compressed:')) {
        compressionLogs.push(msg.text());
      }
    });

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'test-2mb.png'));

    // Wait for compression (show processing message)
    await expect(page.locator('text=Procesando foto...')).toBeVisible({ timeout: 5000 });

    // Wait for preview to appear
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 10000 });

    // Check buttons changed
    await expect(page.locator('text=Cambiar Foto')).toBeVisible();
    await expect(page.locator('text=Quitar')).toBeVisible();

    // Check file size display (should show compressed size ~500-800KB)
    const sizeText = await page.locator('text=Foto lista para subir').textContent();
    expect(sizeText).toContain('KB');

    // Verify console logs show compression
    await page.waitForTimeout(1000);
    expect(compressionLogs.length).toBeGreaterThan(0);
    expect(compressionLogs.some(log => log.includes('Compressed:'))).toBeTruthy();
  });

  test('should allow photo removal', async ({ page }) => {
    await openReportForm(page);

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'test-2mb.png'));

    // Wait for preview
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 10000 });

    // Click remove
    await page.locator('button:has-text("Quitar")').click();

    // Photo should be gone
    await expect(page.locator('img[alt="Preview"]')).not.toBeVisible();
    await expect(page.locator('text=+ Tomar/Subir Foto')).toBeVisible();
  });

  test('should allow photo replacement', async ({ page }) => {
    await openReportForm(page);

    // Upload first photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'test-2mb.png'));
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 10000 });

    // Replace with second photo
    await page.locator('text=Cambiar Foto').click();
    await fileInput.setInputFiles(path.join(__dirname, 'test-6mb.png'));

    // Should show processing and then new preview
    await expect(page.locator('text=Procesando foto...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 10000 });
  });

  test('should handle 6MB photo compression', async ({ page }) => {
    await openReportForm(page);

    const compressionLogs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Compressed:')) {
        compressionLogs.push(msg.text());
      }
    });

    // Upload 6MB photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'test-6mb.png'));

    // Wait for compression
    await expect(page.locator('text=Procesando foto...')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 15000 });

    // Verify compressed size is reasonable (~1-1.2MB)
    const sizeText = await page.locator('text=Foto lista para subir').textContent();
    expect(sizeText).toContain('KB');

    // Wait for console logs
    await page.waitForTimeout(1000);
    expect(compressionLogs.length).toBeGreaterThan(0);
  });

  test('should submit walkability check without photo', async ({ page }) => {
    await openReportForm(page);

    // Fill SEGURIDAD section (first accordion)
    await page.locator('button:has-text("Sí")').first().click(); // hasSidewalk
    await page.locator('text=★').nth(3).click(); // widthRating: 4

    // Submit without photo - button should be enabled and clickable
    const submitButton = page.locator('button:has-text("Guardar Chequeo")');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Button should change to "Guardando..." during submission
    await expect(page.locator('button:has-text("Guardando...")')).toBeVisible({ timeout: 2000 });
  });

  test('should not allow submit while compressing', async ({ page }) => {
    await openReportForm(page);

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'test-6mb.png'));

    // While processing, submit button should be disabled
    await page.waitForSelector('text=Procesando foto...', { timeout: 5000 });
    const submitButton = page.locator('button:has-text("Guardar Chequeo")');
    await expect(submitButton).toBeDisabled();

    // After compression, should be enabled again
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 15000 });
    await expect(submitButton).toBeEnabled();
  });

  test('should show UI responsiveness during compression', async ({ page }) => {
    await openReportForm(page);

    // Upload large photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, 'test-6mb.png'));

    // Should show spinner immediately
    await expect(page.locator('.animate-spin')).toBeVisible({ timeout: 1000 });
    await expect(page.locator('text=Procesando foto...')).toBeVisible();

    // Wait for compression to complete
    await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 15000 });
  });
});
