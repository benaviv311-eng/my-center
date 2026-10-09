const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const gameDir = path.join(root, 'raishin-legacy');
const htmlPath = path.join(gameDir, 'index.html');
const cssPath = path.join(gameDir, 'styles.css');
const jsPath = path.join(gameDir, 'game.js');
const assetPath = path.join(gameDir, 'assets', 'gameplay', 'gameplay-hud-v1.png');

for (const p of [htmlPath, cssPath, jsPath]) {
  assert.ok(fs.existsSync(p), `missing required file: ${path.relative(root,p)}`);
}

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');
const all = `${html}\n${css}\n${js}`;

assert.match(html, /data-game-aspect="16:9"/, 'game frame must declare 16:9');
assert.match(html, /\.\/styles\.css/, 'must use local stylesheet');
assert.match(html, /\.\/game\.js/, 'must use local game script');
assert.match(html, /\.\/assets\/gameplay\/gameplay-hud-v1\.png/, 'must use approved gameplay asset');
assert.doesNotMatch(all, /raika\.html|raika-[^\s"']+\.(?:js|css)/i, 'standalone game must not depend on Raika site files');

for (const marker of ['Health', 'Raihatsu', 'Objective', 'Jump', 'Dodge', 'Interact', 'minimap']) {
  assert.ok(all.includes(marker), `missing HUD marker: ${marker}`);
}

assert.match(css, /overflow-x\s*:\s*hidden/, 'page must prevent horizontal overflow');
assert.match(css, /aspect-ratio\s*:\s*16\s*\/\s*9/, 'game frame must preserve 16:9');
assert.match(css, /object-fit\s*:\s*contain/, 'approved image must not stretch or crop');
assert.match(css, /orientation\s*:\s*portrait/, 'portrait responsive rule required');
assert.match(css, /orientation\s*:\s*landscape/, 'landscape responsive rule required');
assert.ok(fs.existsSync(assetPath), 'approved gameplay asset must exist');

console.log('PASS: Raishin Legacy v0.1 standalone contract');
