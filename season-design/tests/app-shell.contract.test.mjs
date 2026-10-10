import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

test('SeasonDesign shell declares Hebrew RTL product identity and standalone navigation', () => {
  const layout = read('app/layout.tsx');
  const home = read('app/(app)/page.tsx');
  const manifest = JSON.parse(read('public/manifest.webmanifest'));
  assert.match(layout, /lang=["']he["']/);
  assert.match(layout, /dir=["']rtl["']/);
  assert.match(layout, /SeasonDesign/);
  assert.match(home, /SeasonDesign/);
  assert.equal(manifest.name, 'SeasonDesign');
  assert.equal(manifest.display, 'standalone');
});
