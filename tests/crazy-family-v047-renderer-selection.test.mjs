import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const bootstrap = await import('../crazy-family/bootstrap.js');
assert.equal(typeof bootstrap.resolveCrazyFamilyRenderer, 'function', 'renderer resolver must be exported');
assert.equal(bootstrap.resolveCrazyFamilyRenderer(''), 'cinematic');
assert.equal(bootstrap.resolveCrazyFamilyRenderer('?renderer=cinematic'), 'cinematic');
assert.equal(bootstrap.resolveCrazyFamilyRenderer('?renderer=3d'), 'native3d');
assert.equal(bootstrap.resolveCrazyFamilyRenderer('?renderer=wat'), 'cinematic');

const source = await fs.readFile(new URL('../crazy-family/bootstrap.js', import.meta.url), 'utf8');
assert.match(source, /\.\/game-3d\.js/, 'native renderer must have a dedicated game module');
assert.match(source, /\.\/game\.js/, 'cinematic renderer must remain available');
assert.match(source, /try\s*\{[\s\S]*game-3d[\s\S]*\}\s*catch\s*\(/, 'native startup must be guarded by fallback handling');
assert.match(source, /WebGL unavailable/, 'existing WebGL unsupported handling must stay intact');

console.log('v0.47 renderer selection tests passed');
