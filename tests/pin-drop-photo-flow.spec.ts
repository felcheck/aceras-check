import { test, expect } from '@playwright/test';

test.describe('Pin Drop Photo Flow', () => {
  test('should show photo options after dropping pin on desktop', async ({ page }) => {
    // Navigate to app
    await page.goto('/');

    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Drop a pin by clicking on the map
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });

    // Wait for the drawer/modal to appear
    await page.waitForTimeout(500);

    // Take a screenshot to see current state
    await page.screenshot({ path: 'tests/screenshots/after-pin-drop.png', fullPage: true });

    // Check what's visible after dropping pin
    const drawerContent = await page.locator('body').textContent();
    console.log('Content after pin drop:', drawerContent?.slice(0, 500));

    // Look for the "Chequear Acera Aquí" button (current behavior)
    const checkButton = page.locator('button:has-text("Chequear Acera Aquí")');
    const isCheckButtonVisible = await checkButton.isVisible().catch(() => false);
    console.log('Chequear Acera Aquí button visible:', isCheckButtonVisible);

    // Look for photo buttons (expected new behavior)
    const cameraButton = page.locator('button:has-text("Usar Cámara")');
    const uploadButton = page.locator('button:has-text("Subir Archivo")');
    const singlePhotoButton = page.locator('button:has-text("Agregar Foto")');

    const isCameraButtonVisible = await cameraButton.isVisible().catch(() => false);
    const isUploadButtonVisible = await uploadButton.isVisible().catch(() => false);
    const isSinglePhotoButtonVisible = await singlePhotoButton.isVisible().catch(() => false);

    console.log('Usar Cámara button visible:', isCameraButtonVisible);
    console.log('Subir Archivo button visible:', isUploadButtonVisible);
    console.log('Agregar Foto button visible:', isSinglePhotoButtonVisible);

    // For now, this test documents current behavior
    // We expect either the two desktop buttons OR the single mobile button
    // to be visible immediately after pin drop
  });

  test('should show collapsed drawer with expand option after pin drop', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Drop pin
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });
    await page.waitForTimeout(500);

    // Check for the collapsed drawer
    const expandButton = page.locator('button:has-text("Chequear Acera Aquí")');
    await expect(expandButton).toBeVisible({ timeout: 5000 });

    // Click to expand
    await expandButton.click();

    // Take screenshot of expanded state
    await page.screenshot({ path: 'tests/screenshots/after-expand.png', fullPage: true });
  });

  test('expanding drawer should open camera (current flow)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // Drop pin
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });
    await page.waitForTimeout(500);

    // Click expand button
    const expandButton = page.locator('button:has-text("Chequear Acera Aquí")');
    await expandButton.click();

    // Check if camera opens or auth modal appears
    await page.waitForTimeout(1000);

    // Take screenshot to see what appears
    await page.screenshot({ path: 'tests/screenshots/after-expand-click.png', fullPage: true });

    // Check for camera UI elements
    const cameraUI = page.locator('text=Fotografía la Acera');
    const authModal = page.locator('text=Iniciar Sesión');

    const hasCameraUI = await cameraUI.isVisible().catch(() => false);
    const hasAuthModal = await authModal.isVisible().catch(() => false);

    console.log('Camera UI visible:', hasCameraUI);
    console.log('Auth modal visible:', hasAuthModal);

    // Either camera or auth modal should appear
    expect(hasCameraUI || hasAuthModal).toBeTruthy();
  });
});
