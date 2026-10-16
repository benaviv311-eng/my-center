import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const charactersSource = await fs.readFile(new URL('../../crazy-family/characters.js', import.meta.url), 'utf8');
const nativeSource = await fs.readFile(new URL('../../crazy-family/characters-3d.js', import.meta.url), 'utf8');
const adapterSource = await fs.readFile(new URL('../../crazy-family/characters-world3d-adapter.js', import.meta.url), 'utf8');
const sceneSource = await fs.readFile(new URL('../../crazy-family/scene-3d.js', import.meta.url), 'utf8');

assert.match(sceneSource, /visualStage\.name\s*=\s*'world3d-stage'/, 'world3d scene must expose its native stage identity');
assert.match(charactersSource, /from '\.\/characters-world3d-adapter\.js'/, 'character router must import the world3d adapter');
assert.match(charactersSource, /scene\?\.name\s*===\s*'world3d-stage'/, 'world3d stage must select volumetric characters');
assert.match(charactersSource, /createWorld3DCharacterVisual/, 'world3d stage must return the compatibility adapter');

assert.doesNotMatch(nativeSource, /PlaneGeometry/, 'native characters may not contain PlaneGeometry');
assert.match(nativeSource, /export function createCharacter3D\(/, 'native character constructor must stay asset-agnostic');
assert.match(adapterSource, /from '\.\/characters-3d\.js'/, 'adapter must wrap the volumetric character core');
assert.match(adapterSource, /export function createWorld3DCharacterVisual\(/, 'world3d compatibility adapter must be exported');
assert.match(adapterSource, /Math\.atan2\(/, 'native adapter must derive true world-space Y facing from movement');
assert.match(adapterSource, /faceCamera\(\)\s*\{\s*\}/, 'native characters must never billboard toward the camera');
assert.match(adapterSource, /isVolumetric3D:\s*true/, 'native adapter must expose a diagnostic marker');

assert.match(charactersSource, /new THREE\.PlaneGeometry/, 'cinematic sprite fallback must remain intact');
assert.match(charactersSource, /APPROVED_LIBI_ASSET/, 'approved Libi sprite fallback must remain intact');
assert.match(charactersSource, /APPROVED_DAD_ASSET/, 'approved Dad sprite fallback must remain intact');

console.log('world3d volumetric character integration tests passed');
