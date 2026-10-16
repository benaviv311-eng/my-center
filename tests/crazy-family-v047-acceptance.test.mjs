import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const html=await fs.readFile(new URL('../crazy-family.html',import.meta.url),'utf8');
const bootstrap=await fs.readFile(new URL('../crazy-family/bootstrap.js',import.meta.url),'utf8');
const chars=await fs.readFile(new URL('../crazy-family/characters-3d.js',import.meta.url),'utf8');
const game3d=await fs.readFile(new URL('../crazy-family/game-3d.js',import.meta.url),'utf8');
const scene3d=await fs.readFile(new URL('../crazy-family/scene-3d.js',import.meta.url),'utf8');

assert.match(html,/three@0\.180\.0/,'Three.js import map version must stay pinned');
assert.match(html,/LIBI_AUDIO_ORDER_V046='context-only-13-39'/,'v0.46 contextual Libi audio mapping must remain intact');
assert.match(bootstrap,/CRAZY_FAMILY_VERSION\s*=\s*'v0\.47'/,'native acceptance slice must publish v0.47');
assert.match(bootstrap,/params\.get\('renderer'\)\s*===\s*'3d'/,'renderer=3d must select native mode');
assert.match(bootstrap,/return params\.get\('renderer'\) === '3d' \? 'native3d' : 'cinematic'/,'bare route must continue to default to cinematic');
assert.match(bootstrap,/\.\/game\.js/,'cinematic fallback must remain');
assert.match(bootstrap,/\.\/game-3d\.js/,'native path must remain');
assert.doesNotMatch(chars,/PlaneGeometry/,'native character source must stay volumetric');
assert.doesNotMatch(game3d,/cinematic-projection|projectWorldToCinematicStage|projectWorld\(/,'native game must not flatten actors');
assert.match(scene3d,/PerspectiveCamera/,'native scene must use perspective');
assert.doesNotMatch(scene3d,/OrthographicCamera/,'native scene must not regress to orthographic');

console.log('v0.47 acceptance tests passed');
