import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));
await page.route('**/*.mp3', route => route.abort());

try {
  await page.goto('http://127.0.0.1:8000/crazy-family.html?movie-set-smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.__crazyFamilyMovieSetGame?.scene?.renderer), null, { timeout: 30000 });
  await page.waitForSelector('#movieSetRoot .movie-set-canvas', { state: 'visible', timeout: 10000 });

  const initial = await page.evaluate(() => {
    const game = window.__crazyFamilyMovieSetGame;
    return {
      bodyClass: document.body.className,
      legacyHidden: document.getElementById('game')?.hidden,
      unsupported: Boolean(document.querySelector('.movie-set-unsupported')),
      player: { ...game.player.position },
      worldId: game.world.id,
      objectIds: game.world.objects.map(o => o.id),
      shadowEnabled: game.scene.renderer.shadowMap.enabled,
      contextLost: game.scene.renderer.getContext().isContextLost(),
      cameraY: game.scene.camera.position.y,
    };
  });

  assert.match(initial.bodyClass, /movie-set-mode/);
  assert.equal(initial.legacyHidden, true);
  assert.equal(initial.unsupported, false);
  assert.equal(initial.worldId, 'living-room');
  for (const id of ['floor', 'sofa', 'coffee-table', 'rug', 'toy-ball', 'doorway']) assert.ok(initial.objectIds.includes(id), `missing 3D object ${id}`);
  assert.equal(initial.shadowEnabled, true);
  assert.equal(initial.contextLost, false);
  assert.ok(initial.cameraY > initial.player.y + 1, 'camera must be above player');

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(550);
  await page.keyboard.up('ArrowRight');
  const moved = await page.evaluate(() => ({ ...window.__crazyFamilyMovieSetGame.player.position }));
  assert.ok(Math.hypot(moved.x - initial.player.x, moved.z - initial.player.z) > 0.2, 'camera-relative movement did not move Libi in world space');

  await page.keyboard.press('Space');
  await page.waitForTimeout(110);
  const airborneY = await page.evaluate(() => window.__crazyFamilyMovieSetGame.player.position.y);
  assert.ok(airborneY > 0.08, `jump did not raise world Y: ${airborneY}`);
  await page.waitForFunction(() => Math.abs(window.__crazyFamilyMovieSetGame.player.position.y) < 0.02, null, { timeout: 4000 });
  const landedY = await page.evaluate(() => window.__crazyFamilyMovieSetGame.player.position.y);
  assert.ok(Math.abs(landedY) < 0.02, `Libi did not return to room floor: ${landedY}`);

  const canvasBox = await page.locator('#movieSetRoot .movie-set-canvas').boundingBox();
  assert.ok(canvasBox && canvasBox.width > 500 && canvasBox.height > 300, '3D canvas is not laid out at gameplay size');

  await fs.mkdir('artifacts', { recursive: true });
  await page.locator('.stage').screenshot({ path: 'artifacts/crazy-family-movie-set.png' });

  const fatalErrors = pageErrors.filter(message => !/play\(\) request was interrupted|AbortError|media/i.test(message));
  assert.deepEqual(fatalErrors, [], `browser page errors: ${fatalErrors.join(' | ')}`);
  console.log('PASS: Three.js movie set booted in Chromium, rendered the living room, moved and jumped in world space');
} finally {
  await browser.close();
}
