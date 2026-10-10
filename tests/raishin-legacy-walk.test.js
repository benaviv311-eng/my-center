const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const gameDir = path.join(root, 'raishin-legacy');
const movementPath = path.join(gameDir, 'movement.js');
const html = fs.readFileSync(path.join(gameDir, 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(gameDir, 'game.js'), 'utf8');

assert.ok(fs.existsSync(movementPath), 'movement module must exist');
const movement = require(movementPath);

assert.deepStrictEqual(movement.inputVector(new Set(['KeyW'])), { x: 0, y: -1 });
assert.deepStrictEqual(movement.inputVector(new Set(['ArrowRight'])), { x: 1, y: 0 });
assert.deepStrictEqual(movement.inputVector(new Set(['KeyA', 'KeyS'])), { x: -1, y: 1 });
assert.strictEqual(movement.directionFromVector({ x: 0, y: -1 }, 'down'), 'up');
assert.strictEqual(movement.directionFromVector({ x: 1, y: 0 }, 'down'), 'right');
assert.strictEqual(movement.directionFromVector({ x: 0, y: 0 }, 'left'), 'left');

const moved = movement.stepPlayer({ x: 500, y: 500 }, { x: 1, y: 0 }, 1, { minX: 200, maxX: 1400, minY: 340, maxY: 830 }, 120);
assert.strictEqual(moved.x, 620);
assert.strictEqual(moved.y, 500);
const clamped = movement.stepPlayer({ x: 1390, y: 820 }, { x: 1, y: 1 }, 1, { minX: 200, maxX: 1400, minY: 340, maxY: 830 }, 120);
assert.strictEqual(clamped.x, 1400);
assert.strictEqual(clamped.y, 830);
assert.strictEqual(movement.frameAt(0, true, 8, 10), 0);
assert.strictEqual(movement.frameAt(0.35, true, 8, 10), 3);
assert.strictEqual(movement.frameAt(5, false, 8, 10), 0);
assert.ok(movement.scaleForDepth(340, 340, 830) < movement.scaleForDepth(830, 340, 830));

assert.match(html, /id="gameCanvas"/, 'game canvas required');
assert.match(html, /movement\.js/, 'movement module script required');
assert.match(html, /raika-walk-4dir-8f\.png/, 'walk sprite asset required');
assert.match(html, /inazuma-main-hall-clean\.png/, 'clean dojo background required');
assert.match(js, /requestAnimationFrame/, 'render loop required');
assert.match(js, /keydown/, 'keyboard input required');
assert.match(js, /keyup/, 'keyboard input release required');

console.log('PASS: Raishin Legacy free-roam walk contract');
